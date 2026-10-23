// In-memory stand-in for the live-sync server functions, for fast Node tests of the client. It follows the same
// contract as supabase/migrations/20261023120000_live_sync.sql (receipts, per-child change counter, merge rules,
// bounded pages, tombstones); the real functions are exercised separately against PostgreSQL (supabase/tests).
import { checkChange, check, SYNC_SCHEMA, type Operation, type Stamp } from '../../../src/sync/validate.ts'
import { TransportError, type Membership, type PullPage, type PushResult, type SyncTransport } from '../../../src/sync/transport.ts'

type Obj = Record<string, unknown>
interface Rec { kind: string; key: string; value: Obj | null; deleted: boolean; stamps: Record<string, Stamp>; seq: number }

const gt = (a: Stamp, b: Stamp | undefined) => !b || a.t > b.t || (a.t === b.t && (a.c > b.c || (a.c === b.c && a.d > b.d)))
const rank = (s: unknown) => ({ presented: 0, answered: 1, corrected: 2, flagged_replaced: 3, invalidated: 3 } as Record<string, number>)[String(s)] ?? -1
const ORDER = ['task', 'presentation', 'answer_event', 'completion', 'checkpoint', 'story_state', 'target', 'amendment', 'flag', 'suspension',
  'exposure', 'rest_day', 'setting', 'timezone_change', 'guards', 'content_version', 'pack_version', 'active_pack', 'case_link', 'production_event']

export class FakeSyncServer {
  /** user id → children they parent */
  members = new Map<string, Membership[]>()
  /** access token → user id; tokens in `expired` answer 401 */
  tokens = new Map<string, string>()
  expired = new Set<string>()
  offline = false
  /** Apply the next push, then fail as if the response was lost. */
  loseNextResponse = false
  /** Hold every request until released (for stale-response tests). */
  gate: Promise<void> | null = null
  nowMs = () => Date.now()
  requests: { fn: string; body: string }[] = []
  private children = new Map<string, { head: number; records: Map<string, Rec>; receipts: Map<string, { hash: string; stamp: Stamp }>; devices: Map<string, number>; history: Obj[] }>()

  child(id: string) {
    let c = this.children.get(id)
    if (!c) { c = { head: 0, records: new Map(), receipts: new Map(), devices: new Map(), history: [] }; this.children.set(id, c) }
    return c
  }
  records(childId: string) { return [...this.child(childId).records.values()] }
  history(childId: string) { return this.child(childId).history }

  private auth(token: string): string {
    if (this.offline) throw new TransportError('offline', 'network')
    if (this.expired.has(token) || !this.tokens.has(token)) throw new TransportError('unauthorized', '401')
    return this.tokens.get(token) as string
  }
  private owns(user: string, childId: string) {
    if (!(this.members.get(user) ?? []).some((m) => m.child_id === childId)) throw new TransportError('forbidden', 'not_authorized')
  }

  private merge(childId: string, change: Obj, stamp: Stamp, opId: string) {
    const c = this.child(childId)
    const kind = String(change.kind), key = String(change.key)
    const spec = SYNC_SCHEMA.kinds[kind as keyof typeof SYNC_SCHEMA.kinds]
    const old = c.records.get(`${kind}|${key}`)
    const nv = (change.value ?? null) as Obj | null
    const del = change.deleted === true
    let value: Obj | null, deleted: boolean, stamps: Record<string, Stamp>
    const field = spec.class === 'target' ? 'mapping_status' : spec.class === 'flag' ? 'decision' : 'value'
    if (!old) {
      value = del ? null : structuredClone(nv); deleted = del
      stamps = ['editable', 'target', 'flag'].includes(spec.class) ? { [field]: stamp } : {}
    } else {
      value = structuredClone(old.value); deleted = old.deleted; stamps = { ...old.stamps }
      const v = value as Obj, n = nv as Obj
      switch (spec.class) {
        case 'add_only': break
        case 'presentation': if (rank(n.status) > rank(v.status)) v.status = n.status; break
        case 'task': {
          v.cursor = Math.max(Number(v.cursor), Number(n.cursor))
          v.active_seconds = Math.max(Number(v.active_seconds), Number(n.active_seconds))
          v.status = v.status === 'finalised' || n.status === 'finalised' ? 'finalised' : n.status
          v.finalised_at = v.finalised_at ?? n.finalised_at
          const seen = new Map<string, Obj>()
          for (const a of [...(v.activity as Obj[]), ...(n.activity as Obj[])]) seen.set(JSON.stringify(a), a)
          v.activity = [...seen.values()].sort((a, b) => String(a.at).localeCompare(String(b.at)) || String(a.state).localeCompare(String(b.state))).slice(-2000)
          break
        }
        case 'checkpoint': if (n.state === 'delivered' && v.state !== 'delivered') { v.state = 'delivered'; v.delivered_at = n.delivered_at } break
        case 'grow':
          if (kind === 'story_state') {
            v.next_story_seq = Math.max(Number(v.next_story_seq), Number(n.next_story_seq)); v.chapter = Math.max(Number(v.chapter), Number(n.chapter))
            v.world_flags = [...new Set([...(v.world_flags as string[]), ...(n.world_flags as string[])])].sort().slice(0, 500); v.ended = Boolean(v.ended) || Boolean(n.ended)
          } else if (kind === 'exposure') {
            v.first_presented_on = [v.first_presented_on, n.first_presented_on].sort()[0]; v.last_presented_on = [v.last_presented_on, n.last_presented_on].sort()[1]
            v.times = Math.max(Number(v.times), Number(n.times))
          } else for (const k of Object.keys(v)) if (n[k] !== null && (v[k] === null || String(n[k]) > String(v[k]))) v[k] = n[k]
          break
        case 'target': {
          const ids = new Set((v.observations as Obj[]).map((o) => o.id))
          v.observations = [...(v.observations as Obj[]), ...(n.observations as Obj[]).filter((o) => !ids.has(o.id))]
          if (n.mapping_status !== v.mapping_status) {
            if (gt(stamp, stamps.mapping_status)) { c.history.push({ kind, key, field, replaced: v.mapping_status, op: opId }); v.mapping_status = n.mapping_status; stamps.mapping_status = stamp }
            else c.history.push({ kind, key, field, replaced: n.mapping_status, op: opId })
          }
          break
        }
        case 'flag':
          if (n.status !== v.status || n.decided_at !== v.decided_at) {
            if (gt(stamp, stamps.decision)) { c.history.push({ kind, key, field, replaced: { status: v.status, decided_at: v.decided_at }, op: opId }); v.status = n.status; v.decided_at = n.decided_at; stamps.decision = stamp }
            else c.history.push({ kind, key, field, replaced: { status: n.status, decided_at: n.decided_at }, op: opId })
          }
          break
        case 'editable':
          if (del !== old.deleted || JSON.stringify(nv) !== JSON.stringify(old.value)) {
            if (gt(stamp, stamps.value)) { c.history.push({ kind, key, field, replaced: old.value, op: opId }); value = del ? null : structuredClone(nv); deleted = del; stamps.value = stamp }
            else c.history.push({ kind, key, field, replaced: nv, op: opId })
          }
          break
      }
    }
    c.head += 1
    c.records.set(`${kind}|${key}`, { kind, key, value: deleted ? null : value, deleted, stamps, seq: c.head })
  }

  private refsOk(childId: string, changes: Obj[]) {
    const has = (kind: string, key: unknown) => { const r = this.child(childId).records.get(`${kind}|${String(key)}`); return !!r && !r.deleted }
    for (const ch of changes) {
      const v = (ch.value ?? {}) as Obj
      if (ch.kind === 'answer_event' && !has('presentation', v.presentation_id)) return false
      if (ch.kind === 'presentation' && !has('task', v.task_id)) return false
      if ((ch.kind === 'completion' || ch.kind === 'checkpoint') && typeof v.task_id === 'string' && !has('task', v.task_id)) return false
      if (ch.kind === 'flag' && typeof v.presentation_id === 'string' && !has('presentation', v.presentation_id)) return false
      if (ch.kind === 'active_pack' && !has('pack_version', v.version_ref)) return false
      if (ch.kind === 'case_link' && typeof v.engine_target_id === 'string' && !has('target', v.engine_target_id)) return false
    }
    return true
  }

  private applyOp(childId: string, op: Operation): PushResult['results'][number] {
    const c = this.child(childId)
    const hash = JSON.stringify(op)
    const receipt = c.receipts.get(op.op_id)
    if (receipt) {
      if (receipt.hash === hash) return { op_id: op.op_id, status: 'duplicate', stamp: receipt.stamp }
      return { op_id: op.op_id, status: 'rejected', code: 'operation_conflict' }
    }
    if (!check(SYNC_SCHEMA.operation, op) || op.stamp.d !== op.device_id || op.changes.length === 0) return { op_id: op.op_id, status: 'rejected', code: 'invalid_operation' }
    if (!op.changes.every(checkChange)) return { op_id: op.op_id, status: 'rejected', code: 'invalid_change' }
    const last = c.devices.get(op.device_id)
    if (last !== undefined && op.device_seq <= last) return { op_id: op.op_id, status: 'rejected', code: 'out_of_order' }
    // Transactional: work on a copy, keep it only if every change and reference is valid.
    const snapshot = { head: c.head, records: new Map([...c.records].map(([k, v]) => [k, structuredClone(v)])), history: c.history.length }
    const stamp = { ...op.stamp, t: Math.min(op.stamp.t, this.nowMs() + 300_000) }
    for (const ch of [...op.changes].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))) this.merge(childId, ch as unknown as Obj, stamp, op.op_id)
    if (!this.refsOk(childId, op.changes as unknown as Obj[])) {
      c.head = snapshot.head; c.records = snapshot.records; c.history.length = snapshot.history
      return { op_id: op.op_id, status: 'rejected', code: 'invalid_reference' }
    }
    c.devices.set(op.device_id, op.device_seq)
    c.receipts.set(op.op_id, { hash, stamp })
    return { op_id: op.op_id, status: 'applied', stamp }
  }

  private async wait() { if (this.gate) await this.gate }

  transport(): SyncTransport {
    return {
      whoami: async (token) => {
        await this.wait()
        this.requests.push({ fn: 'whoami', body: '' })
        return structuredClone(this.members.get(this.auth(token)) ?? [])
      },
      push: async (token, childId, ops) => {
        await this.wait()
        this.requests.push({ fn: 'push', body: JSON.stringify(ops) })
        this.owns(this.auth(token), childId)
        const results: PushResult['results'] = []
        for (const op of ops) {
          const r = this.applyOp(childId, op)
          results.push(r)
          if (r.status === 'rejected') break
        }
        if (this.loseNextResponse) { this.loseNextResponse = false; throw new TransportError('offline', 'network') }
        return { server_time_ms: this.nowMs(), results }
      },
      pull: async (token, childId, cursor, limit) => {
        await this.wait()
        this.requests.push({ fn: 'pull', body: '' })
        this.owns(this.auth(token), childId)
        const c = this.child(childId)
        const page = Math.min(Math.max(limit, 1), SYNC_SCHEMA.limits.pull_page)
        const rows = [...c.records.values()].filter((r) => r.seq > cursor && r.seq <= c.head).sort((a, b) => a.seq - b.seq).slice(0, page)
        const last = rows.length ? rows[rows.length - 1].seq : c.head
        const out: PullPage = {
          changes: rows.map((r) => ({ seq: r.seq, kind: r.kind as never, key: r.key, value: structuredClone(r.value), deleted: r.deleted })),
          cursor: rows.length < page ? c.head : last, head: c.head, more: rows.length === page && last < c.head, server_time_ms: this.nowMs(),
        }
        return out
      },
    }
  }
}
