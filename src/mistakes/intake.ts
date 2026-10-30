// Accepted anonymous mistake cases → engine targets, with a case-to-target crosswalk.
//
// - One engine target per concrete target. Several cases that concern the same target become several
//   observations on one target, so one correct answer is never counted as several independent corrections.
// - Idempotent: target and observation ids derive from the target ref and the case id. Re-importing the same
//   register adds nothing; a new case on an existing target adds one observation and keeps the stage.
// - Cases were accepted by the parent before export; the app previews them and asks for one confirmation before saving.
// - A target is `mapped` only when the installed release has usable exact, similar and generic questions for
//   it; otherwise it stays `pending_content` (never planned) and appears in the expansion queue.
// - Writing and speaking cases have no engine target. Their evidence is parent-observed production (production.ts).
import type { CatalogueRelease } from '../catalogue/adapter.ts'
import { poolSizes, type TargetInfo } from '../catalogue/chinese.ts'
import { amendmentView, currentTarget, isActiveTarget, leaderOf, mistakeGroups } from '../engine/amendments.ts'
import type { Course, EngineState, Observation, Target } from '../engine/types.ts'
import type { PlanStage, Register } from './pack.ts'

export interface CrosswalkRow {
  case_id: string
  mode: 'objective' | 'external'
  /** Concrete target ref (knowledge point) for objective cases. */
  target_ref: string | null
  /** Engine target id the case's evidence lives on. */
  engine_target_id: string | null
  /** Production plan id (external cases and production follow-ups). */
  plan_id: string | null
  /** Other cases sharing the same concrete target. */
  shared_with: string[]
}

export interface IntakeResult {
  records: Target[]
  crosswalk: CrosswalkRow[]
  added_targets: number
  added_observations: number
  pending: { target_ref: string; missing: PlanStage[]; cases: string[] }[]
}

const TARGET_VALUE = /^[A-Za-z0-9㐀-䶿一-鿿' -]{1,24}$/

export const caseObservationId = (caseId: string) => `case:${caseId.toLowerCase()}`
export const importTargetId = (ref: string) => `case-target:${ref}`
const IMPORT_PREFIX = 'import:'
const importInstanceRef = (registerId: string) => `${IMPORT_PREFIX}${registerId}`
/**
 * Case evidence a pack import added. It is saved with its target, so it identifies the targets a pack's cases
 * live on even when the case links (crosswalk) were never saved or are stale.
 */
export const isImportedCase = (o: Observation) => o.source_type === 'schoolwork' && o.instance_ref.startsWith(IMPORT_PREFIX)

export function missingStages(release: CatalogueRelease, ref: string): PlanStage[] {
  const s = poolSizes(release, ref)
  return (['exact', 'similar', 'generic'] as const).filter((k) => s[k] === 0)
}

export interface CaseHolder {
  /** Every record that holds the case's observation, by id (its import record and any replacements). */
  holders: string[]
  /** The case's current mistake: the group leader of the first holder still standing; null when none stands. */
  current: string | null
  /** `current`, else the first holder: the link a device computes for the case. */
  link: string
}

/**
 * Resolve imported cases to their records from the engine records alone. A stored case link is written once and
 * never rewritten (links sync by latest edit, so devices that recomputed it on every import would overwrite each
 * other); readers resolve the case's current mistake here instead. The result must not depend on the order of
 * records on the device: holders are taken by id, and the mistake is that of the first one still standing.
 *
 * `storedLink` is a fallback for a case whose records have not arrived on this device yet: the link's current
 * version, by its group leader. A case with neither is not imported (null).
 */
export function caseResolver(state: Pick<EngineState, 'targets' | 'amendments'>, view = amendmentView(state)):
  (caseId: string, storedLink?: string | null) => CaseHolder | null {
  const byObs = new Map<string, string[]>()
  for (const t of state.targets) for (const o of t.observations) {
    const ids = byObs.get(o.id)
    if (ids) ids.push(t.id)
    else byObs.set(o.id, [t.id])
  }
  const groups = mistakeGroups(state, view)
  const leader = (id: string) => {
    const t = currentTarget(state, id, view)
    return t ? leaderOf(groups, t.id) : null
  }
  const memo = new Map<string, CaseHolder | null>()
  return (caseId, storedLink = null) => {
    const obs = caseObservationId(caseId)
    const ids = byObs.get(obs)
    if (ids) {
      if (!memo.has(obs)) {
        const holders = [...ids].sort()
        const current = holders.map(leader).find((x) => x !== null) ?? null
        memo.set(obs, { holders, current, link: current ?? holders[0] })
      }
      return memo.get(obs)!
    }
    if (!storedLink || !state.targets.some((t) => t.id === storedLink)) return null
    return { holders: [], current: leader(storedLink), link: storedLink }
  }
}

/**
 * Plan the import. Pure: returns the target records to upsert (new targets and existing targets with any new
 * observations or a changed mapping status) and the crosswalk. `today` is the learning date of the import.
 */
export function planIntake(opts: {
  state: EngineState
  register: Register
  release: CatalogueRelease
  targets: Map<string, TargetInfo>
  today: string
  now: string
}): IntakeResult {
  const { state, register, release, targets, today, now } = opts
  const course = register.course as Course
  const view = amendmentView(state)
  // A case already imported stays where the parent's amendments left it: on its replacement, or invalidated.
  // Re-importing the register never resurrects or duplicates it (its observation id is kept by amendments).
  const holderOf = caseResolver(state, view)
  const byRef = new Map<string, string[]>()
  for (const c of register.cases) {
    if (c.route.mode !== 'objective') continue
    const ref = c.route.progress_target_ref
    byRef.set(ref, [...(byRef.get(ref) ?? []), c.id])
  }
  const records: Target[] = []
  const pending: IntakeResult['pending'] = []
  const engineIdOf = new Map<string, string>()
  let addedTargets = 0
  let addedObservations = 0
  for (const [ref, cases] of byRef) {
    const info = targets.get(ref)
    if (!info) throw new Error(`intake_unknown_target:${ref}`)
    const missing = missingStages(release, ref)
    const mapping: Target['mapping_status'] = missing.length === 0 ? 'mapped' : 'pending_content'
    if (missing.length > 0) pending.push({ target_ref: ref, missing, cases })
    // Cases already imported stay on the record that holds them now (a parent's replacement, or an invalidated
    // record): re-importing the register never resurrects, moves or duplicates them.
    const fresh = cases.filter((caseId) => holderOf(caseId) === null)
    // Reuse an existing active target for the same concrete target (for example an app-caught one, or a parent's
    // corrected replacement), so the learner never has two schedules for one thing.
    const own = state.targets.find((t) => t.id === importTargetId(ref))
    const existing = (own && isActiveTarget(own, view) ? own : undefined)
      // Lowest id first, so every device attaches new cases to the same record of a mistake.
      ?? state.targets.filter((t) => isActiveTarget(t, view) && t.subject === 'chinese' && t.course === course
        && t.knowledge_point_ref === ref && t.assessed_skill === info.assessed_skill).sort((a, b) => a.id.localeCompare(b.id))[0]
    const observations: Observation[] = fresh.map((caseId, i) => ({
      id: caseObservationId(caseId), source_type: 'schoolwork', observed_on: today, recorded_on: today,
      instance_ref: importInstanceRef(register.register_id), batch_ref: null,
      recurrence: i === 0 && !existing ? 'first' : 'independent', invalidated: false,
    }))
    if (existing) {
      if (observations.length > 0 || existing.mapping_status !== mapping) {
        records.push({ ...structuredClone(existing), mapping_status: mapping, observations })
        addedObservations += observations.length
      }
      for (const caseId of fresh) engineIdOf.set(caseId, existing.id)
      continue
    }
    if (observations.length === 0) continue
    const value = info.kind === 'character' || info.kind === 'word' ? info.label : null
    // The usual id is taken by a record the parent amended or invalidated: new cases get a new target of their own.
    const id = own ? `${importTargetId(ref)}:${fresh[0].toLowerCase()}` : importTargetId(ref)
    records.push({
      id, subject: 'chinese', course, target_kind: info.kind, knowledge_point_ref: ref,
      target_value: value && TARGET_VALUE.test(value) ? value : null, assessed_skill: info.assessed_skill,
      error_type: 'unknown_cause', mapping_status: mapping, verification: 'verified', status: 'active',
      verified_at: now, replaces: null, observations,
    })
    for (const caseId of fresh) engineIdOf.set(caseId, id)
    addedTargets += 1
    addedObservations += observations.length
  }
  const crosswalk: CrosswalkRow[] = register.cases.map((c) => {
    if (c.route.mode === 'objective') {
      const ref = c.route.progress_target_ref
      return {
        case_id: c.id, mode: 'objective', target_ref: ref,
        engine_target_id: engineIdOf.get(c.id) ?? holderOf(c.id)?.link ?? null,
        plan_id: c.production_followup?.id ?? null, shared_with: (byRef.get(ref) ?? []).filter((x) => x !== c.id),
      }
    }
    const shared = register.cases.filter((o) => o.id !== c.id && o.route.mode === 'external'
      && o.route.plan.id === (c.route.mode === 'external' ? c.route.plan.id : '')).map((o) => o.id)
    return { case_id: c.id, mode: 'external', target_ref: null, engine_target_id: null, plan_id: c.route.plan.id, shared_with: shared }
  })
  return { records, crosswalk, added_targets: addedTargets, added_observations: addedObservations, pending }
}
