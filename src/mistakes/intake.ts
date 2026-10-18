// Accepted anonymous mistake cases → engine targets, with a case-to-target crosswalk.
//
// - One engine target per concrete target. Several cases that concern the same target become several
//   observations on one target, so one correct answer is never counted as several independent corrections.
// - Idempotent: target and observation ids derive from the target ref and the case id. Re-importing the same
//   register adds nothing; a new case on an existing target adds one observation and keeps the stage.
// - Cases were accepted by the parent before export; intake does not ask for another review.
// - A target is `mapped` only when the installed release has usable exact, similar and generic questions for
//   it; otherwise it stays `pending_content` (never planned) and appears in the expansion queue.
// - Writing and speaking cases have no engine target. Their evidence is parent-observed production (production.ts).
import type { CatalogueRelease } from '../catalogue/adapter.ts'
import { poolSizes, type TargetInfo } from '../catalogue/chinese.ts'
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

export function missingStages(release: CatalogueRelease, ref: string): PlanStage[] {
  const s = poolSizes(release, ref)
  return (['exact', 'similar', 'generic'] as const).filter((k) => s[k] === 0)
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
    // Reuse an existing active target for the same concrete target (for example an app-caught one), so the
    // learner never has two schedules for one thing.
    const existing = state.targets.find((t) => t.id === importTargetId(ref))
      ?? state.targets.find((t) => t.status === 'active' && t.subject === 'chinese' && t.course === course
        && t.knowledge_point_ref === ref && t.assessed_skill === info.assessed_skill)
    const observations: Observation[] = cases.map((caseId, i) => ({
      id: caseObservationId(caseId), source_type: 'schoolwork', observed_on: today, recorded_on: today,
      instance_ref: `import:${register.register_id}`, batch_ref: null,
      recurrence: i === 0 && !existing ? 'first' : 'independent', invalidated: false,
    }))
    if (existing) {
      const fresh = observations.filter((o) => !existing.observations.some((x) => x.id === o.id))
      if (fresh.length > 0 || existing.mapping_status !== mapping) {
        records.push({ ...structuredClone(existing), mapping_status: mapping, observations: fresh })
        addedObservations += fresh.length
      }
      engineIdOf.set(ref, existing.id)
      continue
    }
    const value = info.kind === 'character' || info.kind === 'word' ? info.label : null
    records.push({
      id: importTargetId(ref), subject: 'chinese', course, target_kind: info.kind, knowledge_point_ref: ref,
      target_value: value && TARGET_VALUE.test(value) ? value : null, assessed_skill: info.assessed_skill,
      error_type: 'unknown_cause', mapping_status: mapping, verification: 'verified', status: 'active',
      verified_at: now, replaces: null, observations,
    })
    engineIdOf.set(ref, importTargetId(ref))
    addedTargets += 1
    addedObservations += observations.length
  }
  const crosswalk: CrosswalkRow[] = register.cases.map((c) => {
    if (c.route.mode === 'objective') {
      const ref = c.route.progress_target_ref
      return {
        case_id: c.id, mode: 'objective', target_ref: ref, engine_target_id: engineIdOf.get(ref) ?? null,
        plan_id: c.production_followup?.id ?? null, shared_with: (byRef.get(ref) ?? []).filter((x) => x !== c.id),
      }
    }
    const shared = register.cases.filter((o) => o.id !== c.id && o.route.mode === 'external'
      && o.route.plan.id === (c.route.mode === 'external' ? c.route.plan.id : '')).map((o) => o.id)
    return { case_id: c.id, mode: 'external', target_ref: null, engine_target_id: null, plan_id: c.route.plan.id, shared_with: shared }
  })
  return { records, crosswalk, added_targets: addedTargets, added_observations: addedObservations, pending }
}
