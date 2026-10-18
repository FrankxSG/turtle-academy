// Parent-observed production evidence for writing, pinyin writing and speaking (Functional Design §1/§6: these
// are practised outside the app; recognition success never certifies them).
//
// The parent gives the stage prompt, then records what happened:
//   - `independent` + `correct`: the child produced the target with the model hidden and no help;
//   - `independent` + `not_yet`: an independent attempt that was not yet right;
//   - `supported`: teaching, copying, prompting or help. Recorded as practice; it never clears a stage.
// Progress is re-derived from the append-only events with the same confirmed timing rules as the engine
// (REVIEW_INTERVALS, two clearances per day, generic on a later day than similar, failure → next day), applied
// to this separate evidence type. It never reads or writes recognition evidence.
import { addDays } from '../engine/calendar.ts'
import { MAX_CLEARANCES_PER_TARGET_PER_DAY, REVIEW_INTERVALS } from '../engine/policy.ts'
import type { PlanStage } from './pack.ts'

export type ProductionStage = PlanStage | 'delayed_review'

export interface ProductionEvent {
  id: string
  plan_id: string
  /** The stage the parent assessed (the derived current stage when recorded). */
  stage: ProductionStage
  observed_on: string
  mode: 'independent' | 'supported'
  result: 'correct' | 'not_yet'
  /** Device instant the record was made; orders same-day events. */
  recorded_at: string
}

export interface ProductionProgress {
  plan_id: string
  stage: ProductionStage
  clearances: { stage: ProductionStage; on: string }[]
  independent_correct: number
  independent_not_yet: number
  supported: number
  delayed_checks: { on: string; correct: boolean }[]
  /** Earliest date for the next assessment, or the next delayed check. */
  next_on: string | null
  events: number
  ignored: number
}

const NEXT: Record<PlanStage, ProductionStage> = { exact: 'similar', similar: 'generic', generic: 'delayed_review' }

export function deriveProduction(planId: string, events: ProductionEvent[]): ProductionProgress {
  const pr: ProductionProgress = {
    plan_id: planId, stage: 'exact', clearances: [], independent_correct: 0, independent_not_yet: 0, supported: 0,
    delayed_checks: [], next_on: null, events: 0, ignored: 0,
  }
  let reviewIndex = 0
  let finalNotBefore: string | null = null
  const seen = new Set<string>()
  const list = events.filter((e) => e.plan_id === planId)
    .sort((a, b) => a.observed_on.localeCompare(b.observed_on) || a.recorded_at.localeCompare(b.recorded_at) || a.id.localeCompare(b.id))
  for (const e of list) {
    if (seen.has(e.id)) continue // duplicated records (re-sync, double tap) are one event
    seen.add(e.id)
    pr.events += 1
    if (e.mode === 'supported') { pr.supported += 1; continue }
    if (e.result === 'correct') pr.independent_correct += 1
    else pr.independent_not_yet += 1
    // Evidence only counts at the stage that was due, and only once eligible.
    if (e.stage !== pr.stage || (pr.next_on !== null && e.observed_on < pr.next_on)) { pr.ignored += 1; continue }
    if (pr.stage === 'delayed_review') {
      pr.delayed_checks.push({ on: e.observed_on, correct: e.result === 'correct' })
      if (e.result === 'correct') {
        reviewIndex += 1
        pr.next_on = addDays(e.observed_on, REVIEW_INTERVALS[Math.min(reviewIndex, REVIEW_INTERVALS.length - 1)])
      } else {
        reviewIndex = -1
        pr.next_on = addDays(e.observed_on, 1)
      }
      continue
    }
    if (e.result === 'not_yet') { pr.next_on = addDays(e.observed_on, 1); continue }
    const today = pr.clearances.filter((c) => c.on === e.observed_on).length
    if (today >= MAX_CLEARANCES_PER_TARGET_PER_DAY) { pr.ignored += 1; continue }
    if (pr.stage === 'generic' && finalNotBefore !== null && e.observed_on < finalNotBefore) { pr.ignored += 1; continue }
    pr.clearances.push({ stage: pr.stage, on: e.observed_on })
    const cleared = pr.stage
    pr.stage = NEXT[cleared]
    if (cleared === 'similar') { finalNotBefore = addDays(e.observed_on, 1); pr.next_on = finalNotBefore }
    else if (cleared === 'generic') { reviewIndex = 0; pr.next_on = addDays(e.observed_on, REVIEW_INTERVALS[0]) }
    else pr.next_on = null
  }
  return pr
}
