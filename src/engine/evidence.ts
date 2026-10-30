// Evidence reducer (Learning Engine §2–4). Stage, due date, eligibility and unlock state are derived by
// replaying the append-only answer events and immutable records; nothing here is stored as mutable truth.
// Replaying after a flag decision therefore recalculates progress, while completions and delivered story
// checkpoints (separate records) are never revoked.
import { amendmentView, dismissals, groupChainObservations, groupObservations, laterDismissal, mistakeGroups, mistakeKey, revivals, targetsById, targetStatus, type AmendmentView, type Dismissal, type MistakeGroups } from './amendments.ts'
import { addDays, DateBook } from './calendar.ts'
import { MAX_CLEARANCES_PER_TARGET_PER_DAY, REVIEW_INTERVALS } from './policy.ts'
import type { AnswerEvent, Clearance, EngineState, Presentation, Stage, Target, TargetAggregate } from './types.ts'

export interface TargetProgress {
  target: Target
  stage: Stage
  /** Distinct low-option first successes accumulated at the current repair stage. */
  lowSuccessItems: string[]
  /** Distinct novel-context acquisition test successes (Science). */
  acquisitionSuccessItems: string[]
  /** Earliest learning date for further prescribed practice. */
  notBefore: string | null
  notBeforeReason: 'import_next_day' | 'app_target_next_task' | 'failure_cooldown' | 'final_stage_gate' | 'review_due' | null
  /** An unfinalised task whose failure or creation blocks this target until the day after it finalises. */
  blockedByTask: string | null
  finalStageNotBefore: string | null
  clearances: Clearance[]
  /** Next delayed check date (delayed_review only). */
  dueOn: string | null
  /** Consecutive delayed-check successes; −1 after a wrong check so the next success schedules one day. */
  reviewIndex: number
  everReachedDelayedReview: boolean
  lastIndependentObservationOn: string | null
  /** Tasks in which this target is assessed through a material (whole-task aggregation). */
  wholeTaskRoutes: Set<string>
}

export interface Derived {
  progress: Map<string, TargetProgress>
  aggregates: Map<string, TargetAggregate[]>
  dates: DateBook
  /** First response (phase first) per presentation. */
  firstEvent: Map<string, AnswerEvent>
  /** Learning date on which each finalised task was finalised (its completion record's date). */
  finalisedOn: Map<string, string>
  /** Targets that are one mistake (same progress unit); progress is keyed by each group's leading target. */
  groups: MistakeGroups
  /** "Not a mistake" decisions by progress unit (src/engine/amendments.ts dismissals). */
  dismissed: Map<string, Dismissal>
  /**
   * The amendment view replay used, including dismissed records that came back for observations made after the
   * decision (`revived`). Read target statuses and groups from this view, not a fresh amendmentView.
   */
  view: AmendmentView
  /** Group leader → the decision that applies to the group (its unit's, or the one a member was revived past). */
  groupDismissal: Map<string, Dismissal>
  /** Answers given at or before the decision that applies to their mistake: history only, never evidence. */
  beforeDecision: Set<string>
}

/** The decision, if any, that covers a target's mistake. */
export const dismissalFor = (d: Derived, t: Target): Dismissal | undefined =>
  d.groupDismissal.get(d.groups.leader.get(t.id) ?? t.id) ?? d.dismissed.get(mistakeKey(t))

/** A target's progress, also when the id is another member of its mistake group (for example a frozen plan slot). */
export function progressFor(d: Derived, id: string | null): TargetProgress | undefined {
  return id === null ? undefined : d.progress.get(d.groups.leader.get(id) ?? id)
}

const NEXT: Record<'exact' | 'similar' | 'generic', Stage> = { exact: 'similar', similar: 'generic', generic: 'delayed_review' }
const isRepair = (s: Stage | null): s is 'exact' | 'similar' | 'generic' => s === 'exact' || s === 'similar' || s === 'generic'

/** Items whose evidence is excluded: an open or disabled flag on that item version. */
export function excludedItemVersions(state: EngineState): Set<string> {
  const out = new Set<string>()
  for (const f of state.flags) if (f.status !== 'restored') out.add(`${f.item_id}@${f.item_version}`)
  return out
}

const NONE: ReadonlySet<string> = new Set()

/**
 * Whether an observation still counts apart from amendments: an app-caught observation counts only while the
 * question that produced it is valid evidence (not flagged, disabled or invalidated). One rule for the engine,
 * the parent's progress view, the case report and the parent's duplicate check, so they never disagree.
 */
export function observationCounter(state: EngineState, view: AmendmentView = amendmentView(state), excluded = excludedItemVersions(state)) {
  const presentationById = new Map(state.presentations.map((p) => [p.id, p]))
  return (o: Target['observations'][number]): boolean => {
    if (o.source_type !== 'app_practice' || o.batch_ref === null) return true
    const p = presentationById.get(o.batch_ref)
    return p !== undefined && p.status !== 'flagged_replaced' && p.status !== 'invalidated' && !view.invalidPresentations.has(p.id)
      && !excluded.has(`${p.item_id}@${p.item_version}`)
  }
}

/**
 * Presentations that can carry independent evidence. `invalid` holds presentations a parent invalidated (by
 * amendment; the presentation record's own status may not have reached this device yet).
 */
export function isEvidence(p: Presentation, excluded: Set<string>, invalid: ReadonlySet<string> = NONE): boolean {
  return p.status !== 'flagged_replaced' && p.status !== 'invalidated' && p.first_response_eligible
    && p.target_ref !== null && p.stage !== null && !excluded.has(`${p.item_id}@${p.item_version}`) && !invalid.has(p.id)
}

export function initialStage(t: Target): Stage {
  return t.error_type === 'none' && t.subject === 'science' ? 'acquisition' : 'exact'
}

function fresh(target: Target): TargetProgress {
  return {
    target, stage: initialStage(target), lowSuccessItems: [], acquisitionSuccessItems: [],
    notBefore: null, notBeforeReason: null, blockedByTask: null, finalStageNotBefore: null, clearances: [],
    dueOn: null, reviewIndex: 0, everReachedDelayedReview: false, lastIndependentObservationOn: null,
    wholeTaskRoutes: new Set(),
  }
}

type Step =
  | { kind: 'short'; t: number; seq: number; p: Presentation; e: AnswerEvent }
  | { kind: 'whole'; t: number; seq: number; taskId: string; ps: Presentation[] }
  | { kind: 'observation'; t: number; seq: number; taskId: string; recurrence: 'first' | 'independent'; on: string }

export function derive(state: EngineState): Derived {
  const instants: string[] = []
  for (const e of state.events) instants.push(e.at)
  for (const a of state.amendments) instants.push(a.at)
  for (const t of state.tasks) {
    instants.push(t.created_at)
    if (t.finalised_at) instants.push(t.finalised_at)
    for (const a of t.activity) instants.push(a.at)
  }
  const dates = new DateBook(state.settings, instants)
  const firstEvent = new Map<string, AnswerEvent>()
  for (const e of [...state.events].sort((a, b) => a.local_seq - b.local_seq)) {
    if (e.phase === 'first' && !firstEvent.has(e.presentation_id)) firstEvent.set(e.presentation_id, e)
  }
  const finalisedOn = new Map<string, string>()
  for (const c of state.completions) if (c.task_id) finalisedOn.set(c.task_id, c.local_date)
  const taskById = new Map(state.tasks.map((t) => [t.id, t]))
  const finalTime = (taskId: string): number => {
    const t = taskById.get(taskId)
    return t?.finalised_at ? Date.parse(t.finalised_at) : Number.POSITIVE_INFINITY
  }

  const excluded = excludedItemVersions(state)
  const amended = amendmentView(state)
  const byTarget = new Map<string, Presentation[]>()
  for (const p of state.presentations) {
    if (!isEvidence(p, excluded, amended.invalidPresentations)) continue
    const list = byTarget.get(p.target_ref as string) ?? []
    list.push(p)
    byTarget.set(p.target_ref as string, list)
  }

  const progress = new Map<string, TargetProgress>()
  const aggregates = new Map<string, TargetAggregate[]>()
  const pushAggregate = (taskId: string, a: TargetAggregate) => {
    const list = aggregates.get(taskId) ?? []
    list.push(a)
    aggregates.set(taskId, list)
  }

  const byId = targetsById(state)
  const effectiveObservation = observationCounter(state, amended, excluded)

  // When an observation was made: an app-caught error at its first answer (or when shown), an imported case when
  // its record was confirmed (a new pack case after a decision gets its own record).
  const presentationAt = new Map(state.presentations.map((p) => [p.id, p.presented_at]))
  const instantOf = (o: Target['observations'][number], holder: Target): string | null =>
    o.source_type === 'app_practice'
      ? (o.batch_ref ? firstEvent.get(o.batch_ref)?.at ?? presentationAt.get(o.batch_ref) ?? null : null)
      : holder.verified_at
  const dismissed = new Map([...dismissals(state, (at) => dates.of(at))].map(([k, v]) => [k, { ...v, instantOf }]))
  // A dismissed record that another device added a later case or error to comes back, for what came after only.
  for (const [id, d] of revivals(state, amended, byId, effectiveObservation, (at) => ({ on: dates.of(at), at, instantOf }))) amended.revived.set(id, d)
  const groups = mistakeGroups(state, amended)
  const groupDismissal = new Map<string, Dismissal>()
  const beforeDecision = new Set<string>()
  const answeredAt = (p: Presentation) => firstEvent.get(p.id)?.at ?? p.presented_at
  for (const target of state.targets) {
    // Superseded and invalidated targets (parent amendments) keep their records and evidence but are not replayed.
    if (targetStatus(target, amended) !== 'active') continue
    // Targets that are the same mistake replay once, on the group's leading target, with every member's
    // observations and answers (two devices that each caught the mistake offline converge on one schedule).
    const members = groups.members.get(target.id)
    if (!members) continue
    // A target that exists only because of errors is no mistake at all once none of those observations is valid
    // (its question was flagged, or the parent invalidated it). It stays as a record, never planned.
    // Observations follow the mistake through corrections (src/engine/amendments.ts).
    // The decision on this mistake: its unit's latest, or a later one a member was revived past.
    const dismissal = members.reduce<Dismissal | undefined>((d, id) => laterDismissal(d, amended.revived.get(id)), dismissed.get(mistakeKey(target)))
    if (dismissal) groupDismissal.set(target.id, dismissal)
    const observations = groupObservations(members, amended, byId, effectiveObservation, dismissal)
    if (groupChainObservations(members, amended, byId).length > 0 && observations.length === 0) continue
    const pr = fresh(target)
    progress.set(target.id, pr)
    // New imports start no earlier than the day after the app imported them (Functional Design §4). A later
    // independent import of the same target keeps its stage and moves the earliest practice to the next day.
    for (const o of observations) {
      if (o.source_type === 'app_practice') continue
      const nb = addDays(o.recorded_on, 1)
      if (pr.notBefore === null || nb > pr.notBefore) { pr.notBefore = nb; pr.notBeforeReason = 'import_next_day' }
    }
    // After a decision the mistake starts afresh: answers given up to it are history, not evidence.
    const ps = members.flatMap((id) => byTarget.get(id) ?? []).filter((p) => {
      if (!dismissal || Date.parse(answeredAt(p)) > Date.parse(dismissal.at)) return true
      beforeDecision.add(p.id)
      return false
    })
    const steps: Step[] = []
    let seq = 0
    // Group by task to decide the route: any material presentation makes the whole task one aggregate.
    const perTask = new Map<string, Presentation[]>()
    for (const p of ps) perTask.set(p.task_id, [...(perTask.get(p.task_id) ?? []), p])
    for (const [taskId, list] of perTask) {
      if (list.some((p) => p.material_ref !== null)) {
        pr.wholeTaskRoutes.add(taskId)
        steps.push({ kind: 'whole', t: finalTime(taskId), seq: seq++, taskId, ps: list })
      } else {
        for (const p of list) {
          const e = firstEvent.get(p.id)
          if (e) steps.push({ kind: 'short', t: Date.parse(e.at), seq: e.local_seq, p, e })
        }
      }
    }
    // App-caught observations: one per calendar day (same-day repeats collapse), the earliest valid one is the
    // target's first; stored recurrence labels are recomputed here, so flags and restores replay correctly.
    const seenDays = new Set<string>()
    const appObs = observations.filter((o) => o.source_type === 'app_practice')
      .sort((a, b) => a.observed_on.localeCompare(b.observed_on) || finalTime(a.instance_ref) - finalTime(b.instance_ref))
    for (const o of appObs) {
      if (seenDays.has(o.observed_on)) continue
      const recurrence = seenDays.size === 0 ? 'first' : 'independent'
      seenDays.add(o.observed_on)
      steps.push({ kind: 'observation', t: finalTime(o.instance_ref), seq: seq++, taskId: o.instance_ref, recurrence, on: o.observed_on })
      if (pr.lastIndependentObservationOn === null || o.observed_on > pr.lastIndependentObservationOn) pr.lastIndependentObservationOn = o.observed_on
    }
    steps.sort((a, b) => a.t - b.t || a.seq - b.seq)

    // A failure or creation in a task blocks the target until the day after that task finalises.
    const blockUntilAfter = (taskId: string, reason: 'failure_cooldown' | 'app_target_next_task') => {
      const on = finalisedOn.get(taskId)
      if (on === undefined) {
        pr.blockedByTask = taskId
        pr.notBeforeReason = reason
        return
      }
      const nb = addDays(on, 1)
      if (pr.notBefore === null || nb > pr.notBefore) {
        pr.notBefore = nb
        pr.notBeforeReason = reason
      }
      if (pr.blockedByTask === taskId) pr.blockedByTask = null
    }
    const clearedOn = (date: string) => pr.clearances.filter((c) => c.cleared_on === date).length

    const clear = (stage: Stage, date: string): Clearance | null => {
      if (clearedOn(date) >= MAX_CLEARANCES_PER_TARGET_PER_DAY) return null
      if (stage === 'generic' && pr.finalStageNotBefore !== null && date < pr.finalStageNotBefore) return null
      const c = { stage, cleared_on: date }
      pr.clearances.push(c)
      pr.lowSuccessItems = []
      if (stage === 'acquisition' || stage === 'generic') {
        pr.stage = 'delayed_review'
        pr.everReachedDelayedReview = true
        pr.reviewIndex = 0
        pr.dueOn = addDays(date, REVIEW_INTERVALS[0])
      } else if (isRepair(stage)) {
        pr.stage = NEXT[stage]
        if (stage === 'similar') {
          pr.finalStageNotBefore = addDays(date, 1)
          pr.notBefore = pr.notBefore === null || pr.finalStageNotBefore > pr.notBefore ? pr.finalStageNotBefore : pr.notBefore
          pr.notBeforeReason = 'final_stage_gate'
        }
      }
      return c
    }
    const reviewSuccess = (date: string) => {
      pr.reviewIndex += 1
      pr.dueOn = addDays(date, REVIEW_INTERVALS[Math.min(pr.reviewIndex, REVIEW_INTERVALS.length - 1)])
      pr.notBeforeReason = 'review_due'
    }
    const reviewFailure = (taskId: string) => {
      pr.reviewIndex = -1
      blockUntilAfter(taskId, 'failure_cooldown')
      pr.dueOn = pr.notBefore
    }

    for (const step of steps) {
      if (step.kind === 'observation') {
        if (step.recurrence === 'first') {
          blockUntilAfter(step.taskId, 'app_target_next_task')
        } else if (pr.stage === 'delayed_review') {
          // A recurrence on a completed target keeps the generic stage and resets the interval.
          pr.reviewIndex = -1
          blockUntilAfter(step.taskId, 'app_target_next_task')
          pr.dueOn = pr.notBefore
        } else {
          blockUntilAfter(step.taskId, 'app_target_next_task')
        }
        continue
      }
      if (step.kind === 'short') {
        const { p, e } = step
        const date = dates.of(e.at)
        const independent = e.assistance === 'none'
        if (p.stage !== pr.stage || !independent) continue
        const agg: TargetAggregate = {
          target_ref: target.id, route: 'short_only', starting_stage: pr.stage, related_presentation_ids: [p.id],
          high_option_success_ids: [], low_option_success_ids: [], any_first_wrong: !e.correct, clearances: [],
          outcome: 'retained', final_stage_not_before: null,
        }
        if (pr.stage === 'delayed_review') {
          if (e.correct) { reviewSuccess(date); agg.outcome = 'advanced' } else reviewFailure(p.task_id)
        } else if (pr.stage === 'acquisition') {
          if (!e.correct) {
            pr.stage = 'exact'
            pr.acquisitionSuccessItems = []
            blockUntilAfter(p.task_id, 'failure_cooldown')
          } else if (p.novel_context && !pr.acquisitionSuccessItems.includes(p.item_id)) {
            pr.acquisitionSuccessItems.push(p.item_id)
            agg.high_option_success_ids.push(p.id)
            if (pr.acquisitionSuccessItems.length >= 2) {
              const c = clear('acquisition', date)
              if (c) { agg.clearances.push(c); agg.outcome = 'advanced' }
            } else agg.outcome = 'pending'
          }
        } else if (isRepair(pr.stage)) {
          if (!e.correct) {
            pr.lowSuccessItems = []
            blockUntilAfter(p.task_id, 'failure_cooldown')
          } else {
            const stage = pr.stage
            let met = false
            if (p.format_class === 'high_option') { agg.high_option_success_ids.push(p.id); met = true } else {
              agg.low_option_success_ids.push(p.id)
              if (!pr.lowSuccessItems.includes(p.item_id)) pr.lowSuccessItems.push(p.item_id)
              met = pr.lowSuccessItems.length >= 2
            }
            if (met) {
              const c = clear(stage, date)
              if (c) { agg.clearances.push(c); agg.outcome = 'advanced'; agg.final_stage_not_before = pr.finalStageNotBefore }
            } else agg.outcome = 'pending'
          }
        }
        mergeShortAggregate(aggregates, p.task_id, agg)
        continue
      }
      // Whole-task aggregation: every related first response must be independently correct; finalised once.
      const startingStage = pr.stage
      const related = step.ps.filter((p) => p.stage === startingStage)
      const answered = related.map((p) => [p, firstEvent.get(p.id)] as const).filter(([, e]) => e !== undefined) as [Presentation, AnswerEvent][]
      const agg: TargetAggregate = {
        target_ref: target.id, route: 'whole_task', starting_stage: startingStage,
        related_presentation_ids: related.map((p) => p.id),
        high_option_success_ids: answered.filter(([p, e]) => e.correct && e.assistance === 'none' && p.format_class === 'high_option').map(([p]) => p.id),
        low_option_success_ids: answered.filter(([p, e]) => e.correct && e.assistance === 'none' && p.format_class === 'low_option').map(([p]) => p.id),
        any_first_wrong: answered.some(([, e]) => !e.correct || e.assistance !== 'none'),
        clearances: [], outcome: 'pending', final_stage_not_before: null,
      }
      const finalDate = finalisedOn.get(step.taskId)
      if (finalDate !== undefined && answered.length > 0) {
        if (agg.any_first_wrong) {
          agg.outcome = 'retained'
          if (startingStage === 'delayed_review') reviewFailure(step.taskId)
          else {
            pr.lowSuccessItems = []
            if (startingStage === 'acquisition') { pr.stage = 'exact'; pr.acquisitionSuccessItems = [] }
            blockUntilAfter(step.taskId, 'failure_cooldown')
          }
        } else if (startingStage === 'delayed_review') {
          reviewSuccess(finalDate)
          agg.outcome = 'advanced'
        } else if (isRepair(startingStage)) {
          const lowItems = new Set([...pr.lowSuccessItems, ...answered.filter(([p]) => p.format_class === 'low_option').map(([p]) => p.item_id)])
          const met = agg.high_option_success_ids.length > 0 || lowItems.size >= 2
          if (met) {
            const c = clear(startingStage, finalDate)
            if (c) { agg.clearances.push(c); agg.outcome = 'advanced'; agg.final_stage_not_before = pr.finalStageNotBefore }
            else agg.outcome = 'retained'
          } else {
            pr.lowSuccessItems = [...lowItems]
            agg.outcome = 'retained'
          }
        }
      }
      pushAggregate(step.taskId, agg)
    }
  }
  return { progress, aggregates, dates, firstEvent, finalisedOn, groups, dismissed, view: amended, groupDismissal, beforeDecision }
}

/** Merge per-presentation short-route records into one aggregate per task and target. */
function mergeShortAggregate(aggregates: Map<string, TargetAggregate[]>, taskId: string, a: TargetAggregate) {
  const list = aggregates.get(taskId) ?? []
  const existing = list.find((x) => x.target_ref === a.target_ref && x.route === 'short_only')
  if (!existing) {
    list.push(a)
    aggregates.set(taskId, list)
    return
  }
  existing.related_presentation_ids.push(...a.related_presentation_ids)
  existing.high_option_success_ids.push(...a.high_option_success_ids)
  existing.low_option_success_ids.push(...a.low_option_success_ids)
  existing.any_first_wrong ||= a.any_first_wrong
  for (const c of a.clearances) if (existing.clearances.length < 2) existing.clearances.push(c)
  if (a.final_stage_not_before) existing.final_stage_not_before = a.final_stage_not_before
  existing.outcome = existing.clearances.length > 0 ? 'advanced' : a.outcome === 'pending' && !existing.any_first_wrong ? 'pending' : 'retained'
}

/** Is the target eligible for prescribed practice on a learning date (outside its own whole-task routes)? */
export function isEligible(pr: TargetProgress, date: string): boolean {
  if (pr.target.mapping_status !== 'mapped' || pr.target.verification !== 'verified') return false
  if (pr.blockedByTask !== null) return false
  if (pr.notBefore !== null && date < pr.notBefore) return false
  if (pr.clearances.filter((c) => c.cleared_on === date).length >= MAX_CLEARANCES_PER_TARGET_PER_DAY) return false
  if (pr.stage === 'generic' && pr.finalStageNotBefore !== null && date < pr.finalStageNotBefore) return false
  if (pr.stage === 'delayed_review') return pr.dueOn !== null && pr.dueOn <= date
  return true
}

/** Science prerequisite unlocks: a knowledge point is unlocked once each prerequisite target has ever completed
 * acquisition or its three-stage repair. Later generic failure never re-locks (F07). */
export function completedKnowledgePoints(progress: Map<string, TargetProgress>): Set<string> {
  const out = new Set<string>()
  for (const pr of progress.values()) {
    if (pr.everReachedDelayedReview && pr.target.knowledge_point_ref) out.add(pr.target.knowledge_point_ref)
  }
  return out
}
