// The per-case learning report and its private export.
//
// Stage, clearances, due dates and eligibility come from the engine's replay (`derive`), never from counts.
// Attempt counts here describe what happened (first responses, hint retries, supported corrections, flags);
// they do not decide progress. Production progress comes from production.ts. No evidence → "not yet evidenced".
import type { CatalogueRelease } from '../catalogue/adapter.ts'
import { amendmentView, currentTarget, groupChainObservations, groupObservations, lineage as ancestry, targetsById } from '../engine/amendments.ts'
import { dismissalFor, excludedItemVersions, isEvidence, observationCounter, type Derived } from '../engine/evidence.ts'
import type { EngineState, Presentation, Stage } from '../engine/types.ts'
import { caseObservationId, missingStages, type CrosswalkRow } from './intake.ts'
import type { PlanStage, Register } from './pack.ts'
import { deriveProduction, type ProductionEvent, type ProductionProgress } from './production.ts'

export type CaseStatus =
  | 'not_imported'
  | 'pending_content'
  | 'not_yet_evidenced'
  | 'in_repair'
  | 'in_delayed_review'
  | 'external_only'
  /** The parent marked the case's mistake as not a mistake, or this case as a duplicate. Its history is kept. */
  | 'invalidated'

export interface CaseRow {
  case_id: string
  observation_type: string
  target: string
  /** Null where this device did not load the pack (wrong forms never sync). */
  observed: string | null
  uncertain: boolean
  shared_with: string[]
  status: CaseStatus
  recognition: null | {
    target_ref: string
    content: { exact: number; similar: number; generic: number; missing: PlanStage[]; review_states: string[] }
    stage: Stage | null
    clearances: { stage: Stage; on: string }[]
    first_responses: { correct: number; wrong: number }
    /** First responses that count as evidence (not replaced, invalidated, suspended or ineligible). */
    counted_first_responses: number
    independent_first_correct: number
    hint_retries: number
    supported_corrections: number
    excluded_presentations: number
    delayed_checks: { on: string; correct: boolean }[]
    eligible_from: string | null
    next_delayed_check: string | null
    last_practised_on: string | null
  }
  production: ProductionProgress | null
}

export interface CaseReport {
  schema_version: 'turtle-mistake-report/1'
  register_id: string
  as_of: string
  generated_at: string
  content_version: string | null
  totals: Record<CaseStatus, number> & { cases: number; with_recognition_evidence: number; with_production_evidence: number }
  expansion_queue: { target_ref: string; missing: PlanStage[]; cases: string[] }[]
  cases: CaseRow[]
}

export interface NormalizedEvent {
  event_id: string
  case_ids: string[]
  route_ref: string
  item_id: string
  item_version: number
  presentation_id: string
  task_id: string
  stage: Stage
  phase: 'first' | 'retry' | 'correction'
  answered_on: string
  correct: boolean
  assisted: boolean
  counted_as_evidence: boolean
  task_finalised: boolean
  source: 'engine'
}

export function buildReport(opts: {
  state: EngineState
  derived: Derived
  register: Register
  crosswalk: CrosswalkRow[]
  release: CatalogueRelease | null
  itemStatus: (itemId: string) => string | null
  production: ProductionEvent[]
  asOf: string
  now: string
}): CaseReport {
  const { state, derived, register, crosswalk, release } = opts
  const excluded = excludedItemVersions(state)
  const view = amendmentView(state)
  const byId = targetsById(state)
  const counts = observationCounter(state, view, excluded)
  const cw = new Map(crosswalk.map((r) => [r.case_id, r]))
  const presentationsOf = new Map<string, Presentation[]>()
  for (const p of state.presentations) {
    if (!p.target_ref) continue
    presentationsOf.set(p.target_ref, [...(presentationsOf.get(p.target_ref) ?? []), p])
  }
  const eventsOf = new Map<string, EngineState['events']>()
  for (const e of state.events) eventsOf.set(e.presentation_id, [...(eventsOf.get(e.presentation_id) ?? []), e])
  const queue = new Map<string, { target_ref: string; missing: PlanStage[]; cases: string[] }>()
  const rows: CaseRow[] = register.cases.map((c) => {
    const x = cw.get(c.id)
    const planId = x?.plan_id ?? null
    const production = planId ? deriveProduction(planId, opts.production) : null
    const base = {
      case_id: c.id, observation_type: c.observation_type, target: c.target, observed: c.observed ?? null,
      uncertain: c.source_interpretation_uncertain, shared_with: x?.shared_with ?? [], production,
    }
    if (c.route.mode === 'external') {
      return { ...base, status: 'external_only' as const, recognition: null }
    }
    const ref = c.route.progress_target_ref
    const sizes = release ? countPools(release, ref) : { exact: 0, similar: 0, generic: 0 }
    const missing = release ? missingStages(release, ref) : ['exact', 'similar', 'generic'] as PlanStage[]
    const reviewStates = release ? [...new Set(release.items.filter((i) => i.knowledge_point_ref === ref && i.material_ref === null
      && !i.pools.includes('general')).map((i) => opts.itemStatus(i.id) ?? 'unknown'))].sort() : []
    if (missing.length > 0) {
      const q = queue.get(ref) ?? { target_ref: ref, missing, cases: [] }
      q.cases.push(c.id)
      queue.set(ref, q)
    }
    // A parent's correction moves the case to the replacement target (which inherits no answers); an invalidated
    // case has no current target.
    const linked = x?.engine_target_id ? state.targets.find((t) => t.id === x.engine_target_id) : undefined
    const now = linked ? currentTarget(state, linked.id, view) : null
    // The same mistake recorded under several targets (two devices) is one: report on its group's leader.
    const leaderId = now ? derived.groups.leader.get(now.id) ?? now.id : null
    const current = leaderId ? state.targets.find((t) => t.id === leaderId) ?? now : null
    const members = leaderId ? derived.groups.members.get(leaderId) ?? [leaderId] : []
    const engineId = current?.id ?? null
    const target = current ?? undefined
    const pr = engineId ? derived.progress.get(engineId) : undefined
    const ps = members.flatMap((id) => presentationsOf.get(id) ?? [])
    let firstCorrect = 0, firstWrong = 0, counted = 0, indep = 0, retries = 0, corrections = 0, excludedCount = 0
    const delayed: { on: string; correct: boolean }[] = []
    let last: string | null = null
    for (const p of ps) {
      const evidence = isEvidence(p, excluded, view.invalidPresentations)
      if (!evidence) excludedCount += 1
      for (const e of eventsOf.get(p.id) ?? []) {
        const on = derived.dates.of(e.at)
        if (last === null || on > last) last = on
        if (e.phase === 'first') {
          if (e.correct) firstCorrect += 1
          else firstWrong += 1
          if (evidence) counted += 1
          if (evidence && e.correct && e.assistance === 'none') indep += 1
          if (evidence && p.stage === 'delayed_review') delayed.push({ on, correct: e.correct })
        } else if (e.phase === 'retry') retries += 1
        else corrections += 1
      }
    }
    const recognition = {
      target_ref: ref,
      content: { ...sizes, missing, review_states: reviewStates },
      stage: pr ? pr.stage : null,
      clearances: pr ? pr.clearances.map((k) => ({ stage: k.stage, on: k.cleared_on })) : [],
      first_responses: { correct: firstCorrect, wrong: firstWrong },
      counted_first_responses: counted,
      independent_first_correct: indep,
      hint_retries: retries,
      supported_corrections: corrections,
      excluded_presentations: excludedCount,
      delayed_checks: delayed.sort((a, b) => a.on.localeCompare(b.on)),
      eligible_from: pr ? pr.notBefore : null,
      next_delayed_check: pr && pr.stage === 'delayed_review' ? pr.dueOn : null,
      last_practised_on: last,
    }
    let status: CaseStatus
    // The case's observation follows its mistake through corrections; it is dropped only when marked so.
    const caseObs = caseObservationId(c.id)
    const dropped = current !== null && groupChainObservations(members, view, byId).some((o) => o.id === caseObs)
      && !groupObservations(members, view, byId, counts, dismissalFor(derived, current)).some((o) => o.id === caseObs)
    if ((linked && !current) || dropped) status = 'invalidated'
    else if (!target) status = 'not_imported'
    else if (target.mapping_status === 'pending_content') status = 'pending_content'
    // Only counted first responses are evidence; a replaced or invalidated attempt leaves the case unevidenced.
    else if (counted === 0) status = 'not_yet_evidenced'
    else if (pr?.stage === 'delayed_review') status = 'in_delayed_review'
    else status = 'in_repair'
    return { ...base, status, recognition }
  })
  const totals = {
    cases: rows.length, not_imported: 0, pending_content: 0, not_yet_evidenced: 0, in_repair: 0, in_delayed_review: 0,
    external_only: 0, invalidated: 0, with_recognition_evidence: 0, with_production_evidence: 0,
  }
  for (const r of rows) {
    totals[r.status] += 1
    if (r.recognition && r.recognition.counted_first_responses > 0) totals.with_recognition_evidence += 1
    if (r.production && r.production.events > 0) totals.with_production_evidence += 1
  }
  return {
    schema_version: 'turtle-mistake-report/1', register_id: register.register_id, as_of: opts.asOf, generated_at: opts.now,
    content_version: release?.version ?? null, totals, expansion_queue: [...queue.values()], cases: rows,
  }
}

function countPools(release: CatalogueRelease, ref: string) {
  const out = { exact: 0, similar: 0, generic: 0 }
  for (const i of release.items) {
    if (i.knowledge_point_ref !== ref || i.material_ref !== null) continue
    for (const p of i.pools) if (p === 'exact' || p === 'similar' || p === 'generic') out[p] += 1
  }
  return out
}

/** Every recorded response on a register target, normalized for the private repository (no identities). */
export function normalizedEvents(state: EngineState, derived: Derived, crosswalk: CrosswalkRow[]): NormalizedEvent[] {
  const excluded = excludedItemVersions(state)
  const view = amendmentView(state)
  const casesOf = new Map<string, string[]>()
  const refOf = new Map<string, string>()
  // Case links may point anywhere in the correction chain (they refresh on re-import). Every version's answers
  // remain history, including intermediate replacements and invalidated mistakes; only the current active target
  // can contribute evidence. Walk both directions rather than mapping only the link and its current leaf.
  const current = new Set<string>()
  for (const r of crosswalk) {
    if (!r.engine_target_id || !r.target_ref) continue
    const head = currentTarget(state, r.engine_target_id, view)?.id ?? null
    // The current mistake may be recorded under several targets (two devices): all of them are current.
    const group = head ? derived.groups.members.get(derived.groups.leader.get(head) ?? head) ?? [head] : []
    for (const id of group) current.add(id)
    const lineage = new Set<string>([r.engine_target_id, ...group])
    // Ancestors (every record a correction superseded) and descendants (later corrections).
    for (const start of [...lineage]) {
      for (const id of ancestry(start, view)) lineage.add(id)
      for (let at = view.replacedBy.get(start); at !== undefined && !lineage.has(at); at = view.replacedBy.get(at)) lineage.add(at)
    }
    for (const id of lineage) {
      casesOf.set(id, [...new Set([...(casesOf.get(id) ?? []), r.case_id])])
      refOf.set(id, r.target_ref)
    }
  }
  const byId = new Map(state.presentations.map((p) => [p.id, p]))
  const finalised = new Set(state.tasks.filter((t) => t.status === 'finalised').map((t) => t.id))
  const out: NormalizedEvent[] = []
  for (const e of [...state.events].sort((a, b) => a.local_seq - b.local_seq)) {
    const p = byId.get(e.presentation_id)
    if (!p || !p.target_ref || !casesOf.has(p.target_ref) || p.stage === null) continue
    out.push({
      event_id: e.id, case_ids: casesOf.get(p.target_ref) as string[], route_ref: refOf.get(p.target_ref) as string,
      item_id: p.item_id, item_version: p.item_version, presentation_id: p.id, task_id: p.task_id, stage: p.stage,
      phase: e.phase, answered_on: derived.dates.of(e.at), correct: e.correct, assisted: e.assistance !== 'none',
      // Answers on a target the parent later corrected or invalidated stay in the history but no longer count.
      counted_as_evidence: e.phase === 'first' && isEvidence(p, excluded, view.invalidPresentations) && current.has(p.target_ref), task_finalised: finalised.has(p.task_id), source: 'engine',
    })
  }
  return out
}

export interface PrivateExport {
  schema_version: 'turtle-private-export/1'
  register_id: string
  exported_at: string
  as_of: string
  content_version: string | null
  report: CaseReport
  engine_events: NormalizedEvent[]
  production_events: ProductionEvent[]
}

/** The file a parent saves and commits to the private repository. It holds no names, account or device ids. */
export function buildExport(report: CaseReport, events: NormalizedEvent[], production: ProductionEvent[], exportedAt: string): PrivateExport {
  return {
    schema_version: 'turtle-private-export/1', register_id: report.register_id, exported_at: exportedAt, as_of: report.as_of,
    content_version: report.content_version, report, engine_events: events,
    production_events: [...production].sort((a, b) => a.observed_on.localeCompare(b.observed_on) || a.recorded_at.localeCompare(b.recorded_at)),
  }
}
