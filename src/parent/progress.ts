// What the parent area shows about mistakes and flagged questions (Functional Design §8). Pure views over the engine
// state and its replay: nothing here decides progress, and nothing is stored.
import { amendmentView, chainObservations, isActiveTarget, isImported, targetsById, validObservations } from '../engine/amendments.ts'
import { addDays } from '../engine/calendar.ts'
import { excludedItemVersions, isEligible, isEvidence, type Derived, type TargetProgress } from '../engine/evidence.ts'
import { MAX_CLEARANCES_PER_TARGET_PER_DAY } from '../engine/policy.ts'
import type { EngineState, Flag, Presentation, Stage, Subject, Target } from '../engine/types.ts'

export type RowState =
  | 'repair' | 'delayed_review' | 'learning'
  /** No reviewed questions for it yet: kept, not practised. */
  | 'pending_content'
  /** Its only mistakes came from a question the child flagged; waits for the parent's flag decision. */
  | 'suspended'
  /** Its private pack is set aside on this device, so it gets no practice here for now. */
  | 'held'
  /** Imported but not verified, so not practised. */
  | 'unverified'

export interface ProgressRow {
  target: Target
  state: RowState
  stage: Stage | null
  /** Repair stage 1–3, or null outside repair. */
  repairStep: number | null
  /** When it can next be practised: now, a date, after the unfinished task, or not scheduled. */
  next: { kind: 'now' } | { kind: 'date'; date: string } | { kind: 'after_task' } | { kind: 'none' }
  /** Mistake sources: days the app caught it, and imported observations (private-pack cases sharing one target). */
  appDays: number
  importedCases: number
  /** App recognition answers only. Parent-observed writing/speaking is separate evidence (`production`). */
  recognition: {
    firstAnswers: number
    independentCorrect: number
    firstWrong: number
    hintRetries: number
    corrections: number
    /** First answers on a question the child had already seen (repeated-item, not new-context, evidence). */
    repeatedItems: number
    lastPractisedOn: string | null
  }
  imported: boolean
  /** Imported observations the parent can mark as duplicates (still counting). */
  observations: Target['observations']
}

const REPAIR_STEP: Partial<Record<Stage, number>> = { exact: 1, similar: 2, generic: 3 }

/**
 * When a target can next be practised, using every rule that isEligible applies: the task-finalisation block, the
 * earliest-practice date, the review due date, the later-day final-stage gate and two clearances per day.
 */
export function nextPractice(pr: TargetProgress, today: string): ProgressRow['next'] {
  if (pr.blockedByTask !== null) return { kind: 'after_task' }
  if (isEligible(pr, today)) return { kind: 'now' }
  if (pr.stage === 'delayed_review' && pr.dueOn === null) return { kind: 'none' }
  const dates = [pr.notBefore, pr.stage === 'delayed_review' ? pr.dueOn : null,
    pr.stage === 'generic' ? pr.finalStageNotBefore : null,
    pr.clearances.filter((c) => c.cleared_on === today).length >= MAX_CLEARANCES_PER_TARGET_PER_DAY ? addDays(today, 1) : null]
    .filter((d): d is string => d !== null)
  const date = dates.sort().at(-1)
  return date !== undefined && date > today ? { kind: 'date', date } : { kind: 'none' }
}

/**
 * One row per current target of a subject. Several private-pack cases that share a target are one row (with its
 * case count), so one practice answer never looks like several. Superseded and invalidated targets are history and
 * have no row; a target whose question awaits a flag decision is shown as suspended.
 */
export function progressRows(opts: {
  state: EngineState
  derived: Derived
  today: string
  subject: Subject
  held: ReadonlySet<string>
}): ProgressRow[] {
  const { state, derived, today, subject, held } = opts
  const view = amendmentView(state)
  const byId = targetsById(state)
  const excluded = excludedItemVersions(state)
  const presentationById = new Map(state.presentations.map((p) => [p.id, p]))
  const openFlag = new Set(state.flags.filter((f) => f.status === 'open').map((f) => `${f.item_id}@${f.item_version}`))
  const byTarget = new Map<string, Presentation[]>()
  for (const p of state.presentations) if (p.target_ref) byTarget.set(p.target_ref, [...(byTarget.get(p.target_ref) ?? []), p])
  const eventsOf = new Map<string, EngineState['events']>()
  for (const e of state.events) eventsOf.set(e.presentation_id, [...(eventsOf.get(e.presentation_id) ?? []), e])
  const rows: ProgressRow[] = []
  for (const t of state.targets) {
    if (t.subject !== subject || !isActiveTarget(t, view)) continue
    if (t.error_type === 'none' && t.observations.length === 0) continue // Science acquisition records, not mistakes
    const observations = validObservations(t, view, byId)
    if (observations.length === 0 && chainObservations(t, view, byId).length > 0) continue
    const pr = derived.progress.get(t.id)
    let state_: RowState
    if (!pr) {
      // Only app-caught observations from flagged questions remain: suspended while a flag is open, otherwise the
      // question was disabled or the answer invalidated, and there is no mistake left to show.
      const waiting = observations.some((o) => {
        const p = o.batch_ref ? presentationById.get(o.batch_ref) : undefined
        return p !== undefined && !view.invalidPresentations.has(p.id) && p.status !== 'invalidated' && openFlag.has(`${p.item_id}@${p.item_version}`)
      })
      if (!waiting) continue
      state_ = 'suspended'
    } else if (t.mapping_status === 'pending_content') state_ = 'pending_content'
    else if (t.verification !== 'verified') state_ = 'unverified'
    else if (held.has(t.id)) state_ = 'held'
    else state_ = pr.stage === 'delayed_review' ? 'delayed_review' : pr.stage === 'acquisition' ? 'learning' : 'repair'
    const next: ProgressRow['next'] = pr && (state_ === 'repair' || state_ === 'delayed_review' || state_ === 'learning')
      ? nextPractice(pr, today) : { kind: 'none' }
    const recognition: ProgressRow['recognition'] = { firstAnswers: 0, independentCorrect: 0, firstWrong: 0, hintRetries: 0, corrections: 0, repeatedItems: 0, lastPractisedOn: null }
    for (const p of byTarget.get(t.id) ?? []) {
      const counted = isEvidence(p, excluded, view.invalidPresentations)
      for (const e of eventsOf.get(p.id) ?? []) {
        const on = derived.dates.of(e.at)
        if (recognition.lastPractisedOn === null || on > recognition.lastPractisedOn) recognition.lastPractisedOn = on
        if (e.phase === 'retry') { recognition.hintRetries += 1; continue }
        if (e.phase === 'correction') { recognition.corrections += 1; continue }
        if (!counted) continue
        recognition.firstAnswers += 1
        if (e.correct && e.assistance === 'none') recognition.independentCorrect += 1
        if (!e.correct) recognition.firstWrong += 1
        if (p.prior_exposures > 0) recognition.repeatedItems += 1
      }
    }
    const appDays = new Set(observations.filter((o) => o.source_type === 'app_practice').map((o) => o.observed_on)).size
    rows.push({
      target: t, state: state_, stage: pr?.stage ?? null, repairStep: pr ? REPAIR_STEP[pr.stage] ?? null : null, next,
      appDays, importedCases: observations.filter((o) => o.source_type !== 'app_practice').length, recognition,
      imported: isImported(t), observations: observations.filter((o) => o.source_type !== 'app_practice'),
    })
  }
  const order: Record<RowState, number> = { suspended: 0, repair: 1, learning: 1, delayed_review: 2, pending_content: 3, unverified: 4, held: 5 }
  return rows.sort((a, b) => order[a.state] - order[b.state] || a.target.id.localeCompare(b.target.id))
}

export interface FlagGroup {
  item_id: string
  item_version: number
  /** Open while any flag on this version awaits a decision. */
  status: Flag['status']
  flags: (Flag & { presentation: Presentation | null; contentVersion: string | null; firstAnswer: EngineState['events'][number] | null })[]
}

/** Flagged question versions for this child, open ones first, each with the child's answer if one was given. */
export function flagGroups(state: EngineState): FlagGroup[] {
  const groups = new Map<string, FlagGroup>()
  for (const f of state.flags) {
    const key = `${f.item_id}@${f.item_version}`
    const p = f.presentation_id ? state.presentations.find((x) => x.id === f.presentation_id) ?? null : null
    const contentVersion = p ? state.tasks.find((t) => t.id === p.task_id)?.content_version ?? null : null
    const firstAnswer = p ? state.events.find((e) => e.presentation_id === p.id && e.phase === 'first') ?? null : null
    const g = groups.get(key) ?? { item_id: f.item_id, item_version: f.item_version, status: f.status, flags: [] }
    g.flags.push({ ...f, presentation: p, contentVersion, firstAnswer })
    groups.set(key, g)
  }
  // Open while any flag awaits a decision; otherwise disabled if any decision disabled it (its evidence stays
  // excluded, src/engine/evidence.ts), else restored.
  for (const g of groups.values()) {
    const statuses = new Set(g.flags.map((f) => f.status))
    g.status = statuses.has('open') ? 'open' : statuses.has('disabled') ? 'disabled' : 'restored'
  }
  return [...groups.values()].sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open')
    || (b.flags.at(-1)?.flagged_at ?? '').localeCompare(a.flags.at(-1)?.flagged_at ?? ''))
}

/** Is this answered question one the parent can invalidate (answered, in a finished task, still counting)? */
export function canInvalidateAnswer(state: EngineState, p: Presentation): boolean {
  const view = amendmentView(state)
  return p.status !== 'invalidated' && p.status !== 'flagged_replaced' && !view.invalidPresentations.has(p.id)
    && state.tasks.find((t) => t.id === p.task_id)?.status === 'finalised'
    && state.events.some((e) => e.presentation_id === p.id && e.phase === 'first')
}

