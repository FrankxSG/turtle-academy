// Durable upload queue (outbox) helpers shared by the IndexedDB stores and the in-memory test stores.
//
// An outbox operation is created in the same local transaction as the change it uploads, so a restart keeps every
// committed, unacknowledged operation, and a retry always sends the same operation id and payload. Operations are
// owned: they carry the family and child they were created for, and are only created once the local store is bound
// to that registered family (see `bind` in the stores). Acknowledged operations are removed; the device ordering
// number, the hybrid logical clock and the download checkpoint persist in the store's sync metadata.
import { checkOperation, LIMITS, SYNC_SCHEMA_VERSION, type Change, type Operation, type Stamp } from './validate.ts'
import { sortChanges } from './changes.ts'

export interface Owner { family_id: string; child_id: string }

export interface RecoveryState {
  /** Server head the download started against, and how far it has got. Restartable. */
  started_at: string
  cursor: number
  done: boolean
}

export interface SyncMeta {
  id: 'meta'
  /** This local store's upload identity. A wiped or new device gets a new one. */
  device_id: string
  /** Next per-device ordering number. */
  next_seq: number
  /** The registered family/child this store is bound to; no operation is created before binding. */
  owner: Owner | null
  /** Hybrid logical clock (ms, counter). Advanced by local edits and by server-accepted stamps. */
  hlc: { t: number; c: number }
  /** Download checkpoint: the last server change number applied (records store only). */
  cursor: number
  last_sync_at: string | null
  recovery: RecoveryState | null
}

export interface OutboxOp {
  seq: number
  op_id: string
  schema: typeof SYNC_SCHEMA_VERSION
  owner: Owner
  device_id: string
  stamp: Stamp
  changes: Change[]
  /** `kind|key` for each change, so downloads can skip records with pending local work. */
  keys: string[]
  created_at: string
  /**
   * `rejected`: refused by this device's allow-list (code `local:…`, never sent) or by the server. It stays (never
   * silently dropped) and stops the queue; "Sync now" re-offers server refusals only.
   */
  state: 'pending' | 'rejected'
  code: string | null
}

export const newMeta = (deviceId: string = globalThis.crypto.randomUUID()): SyncMeta => ({
  id: 'meta', device_id: deviceId, next_seq: 1, owner: null, hlc: { t: 0, c: 0 }, cursor: 0, last_sync_at: null, recovery: null,
})

export const changeKey = (c: { kind: string; key: string }) => `${c.kind}|${c.key}`

/** Advance the clock for a local edit. */
export function tick(meta: SyncMeta, nowMs: number): Stamp {
  const t = Math.max(Math.floor(nowMs), meta.hlc.t)
  const c = t === meta.hlc.t ? meta.hlc.c + 1 : 0
  meta.hlc = { t, c }
  return { t, c, d: meta.device_id }
}

/** Advance the clock from a server-accepted stamp, so later local edits order after it. */
export function observe(meta: SyncMeta, s: Pick<Stamp, 't' | 'c'>) {
  if (s.t > meta.hlc.t || (s.t === meta.hlc.t && s.c > meta.hlc.c)) meta.hlc = { t: s.t, c: s.c }
}

export const toWire = (op: OutboxOp): Operation => ({ op_id: op.op_id, device_id: op.device_id, device_seq: op.seq, stamp: op.stamp, changes: op.changes })

/**
 * Turn the changes of one local commit into outbox operations (usually one; a large backfill is split, keeping
 * referenced records first). Advances the metadata's ordering number and clock in place.
 */
export function makeOps(meta: SyncMeta, changes: Change[], now: { iso: string; ms: number }, newId: () => string = () => globalThis.crypto.randomUUID()): OutboxOp[] {
  if (!meta.owner || changes.length === 0) return []
  const owner = meta.owner
  const budget = Math.floor(LIMITS.op_bytes * 0.9)
  const groups: Change[][] = []
  let current: Change[] = []
  let size = 512
  const encoder = new TextEncoder()
  for (const c of sortChanges(changes)) {
    const bytes = encoder.encode(JSON.stringify(c)).length + 1
    if (current.length > 0 && (size + bytes > budget || current.length >= LIMITS.changes_per_op)) {
      groups.push(current)
      current = []
      size = 512
    }
    current.push(c)
    size += bytes
  }
  if (current.length > 0) groups.push(current)
  return groups.map((group) => {
    const op: OutboxOp = {
      seq: meta.next_seq++, op_id: newId(), schema: SYNC_SCHEMA_VERSION, owner: { ...owner }, device_id: meta.device_id,
      stamp: tick(meta, now.ms), changes: group, keys: [...new Set(group.map(changeKey))], created_at: now.iso, state: 'pending', code: null,
    }
    // A change that does not fit the allow-list is kept locally and reported; it never leaves the device.
    const valid = checkOperation(toWire(op))
    if (!valid.ok) { op.state = 'rejected'; op.code = `local:${valid.code}` }
    return op
  })
}
