// Private mistake pack ↔ sync changes (Pilot Scope §3: the pack syncs without wrong forms or authoring notes).
//
// Before upload the pack is stripped of every device-only field: each register case's `observed` wrong form and
// each item's and material's `rationale` and `provenance`. What remains must pass the closed descriptor, which
// bounds practice text per field and keeps `cause`, `correction_status` and `policy` to short single-line text.
// A pack version is identified by its pack id and a digest of the stripped content, so versions are immutable and
// a task pinned to an earlier version can still be rebuilt after recovery.
import type { CrosswalkRow } from '../mistakes/intake.ts'
import { validatePack, type PrivatePack } from '../mistakes/pack.ts'
import type { ProductionEvent } from '../mistakes/production.ts'
import packSchema from './pack-schema.json' with { type: 'json' }
import { check, registerPackSchema, SYNC_SCHEMA, type Change, type KindSpec, type Node } from './validate.ts'

registerPackSchema(packSchema as unknown as { defs: Record<string, Node>; kinds: Record<string, KindSpec> })

type Obj = Record<string, unknown>

/** The pack as it may leave the device. Never mutates the input. */
export function stripPack(pack: PrivatePack): PrivatePack {
  const p = structuredClone(pack) as unknown as Obj & PrivatePack
  for (const c of p.register.cases) delete (c as Partial<typeof c>).observed
  for (const b of p.corrective_batches) {
    for (const i of b.items as unknown as Obj[]) { delete i.rationale; delete i.provenance }
    for (const m of b.materials as unknown as Obj[]) delete m.provenance
  }
  return p
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical((value as Obj)[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export async function versionRef(stripped: PrivatePack): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(stripped)))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${stripped.pack_id}@${hex.slice(0, 16)}`
}

export type PackSyncCheck = { ok: true; ref: string; stripped: PrivatePack } | { ok: false; code: 'pack_not_syncable' }

/** Whether a pack can sync. Codes only: rejected content is never reported or logged. */
export async function syncablePack(pack: PrivatePack): Promise<PackSyncCheck> {
  const stripped = stripPack(pack)
  const ref = await versionRef(stripped)
  if (!check(SYNC_SCHEMA.kinds.pack_version.value, { version_ref: ref, pack: stripped })) return { ok: false, code: 'pack_not_syncable' }
  return { ok: true, ref, stripped }
}

export const packChanges = (ref: string, stripped: PrivatePack): Change[] => [
  { kind: 'pack_version', key: ref, value: { version_ref: ref, pack: stripped as unknown as Obj } },
  { kind: 'active_pack', key: 'active', value: { version_ref: ref } },
]

const row = (r: CrosswalkRow): Obj => ({
  case_id: r.case_id, mode: r.mode, target_ref: r.target_ref, engine_target_id: r.engine_target_id, plan_id: r.plan_id, shared_with: [...r.shared_with],
})

/** Case links: changed rows are edits, rows that disappeared are deletions (tombstones reach offline devices). */
export function caseLinkChanges(previous: CrosswalkRow[], next: CrosswalkRow[]): Change[] {
  const before = new Map(previous.map((r) => [r.case_id, JSON.stringify(row(r))]))
  const out: Change[] = []
  for (const r of next) if (before.get(r.case_id) !== JSON.stringify(row(r))) out.push({ kind: 'case_link', key: r.case_id, value: row(r) })
  const kept = new Set(next.map((r) => r.case_id))
  for (const id of before.keys()) if (!kept.has(id)) out.push({ kind: 'case_link', key: id, deleted: true })
  return out
}

export const productionChange = (e: ProductionEvent): Change => ({
  kind: 'production_event', key: e.id,
  value: { id: e.id, plan_id: e.plan_id, stage: e.stage, observed_on: e.observed_on, mode: e.mode, result: e.result, recorded_at: e.recorded_at },
})

/**
 * A downloaded pack version for local use. When this device holds the same version with its wrong forms (it is the
 * device that loaded the pack), those device-only values are kept; a recovered device works without them.
 */
export function withLocalWrongForms(remote: PrivatePack, local: PrivatePack | null): PrivatePack {
  const pack = structuredClone(remote)
  if (!local || local.register.register_id !== remote.register.register_id) return pack
  // Same register, same case and same correct target: the wrong form recorded for it on this device still applies.
  const observed = new Map(local.register.cases.map((c) => [`${c.id}\u0000${c.target}`, c.observed]))
  for (const c of pack.register.cases) {
    const o = observed.get(`${c.id}\u0000${c.target}`)
    if (typeof o === 'string') c.observed = o
  }
  return pack
}

/** Whether a downloaded pack version can be used by this app version (restore checks before applying anything). */
export function usablePackVersion(value: unknown): boolean {
  if (!check(SYNC_SCHEMA.kinds.pack_version.value, value)) return false
  try {
    validatePack((value as { pack: unknown }).pack)
    return true
  } catch {
    return false
  }
}
