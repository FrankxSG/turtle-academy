// Parent amendments (Functional Design §8; Learning Engine §5, F23/F51). Amendments are add-only records with
// provenance: the corrected or invalidated records themselves are never edited, and replay reads the amendments
// to decide which targets, observations and answers still count. Because amendments and new target records are
// add-only in sync (Pilot Scope §3 rules 1 and 5), every device that holds them derives the same progress.
import type { Amendment, EngineState, Target } from './types.ts'

/** Reducer revision that interprets the target/observation/answer amendments below. */
export const AMENDMENT_REVISION = 2

export type AmendReason = 'wrong_target' | 'wrong_skill' | 'wrong_error_type'
export type InvalidateReason = 'not_a_mistake' | 'duplicate' | 'question_problem'

export interface AmendmentView {
  /** Superseded target → its replacement. */
  replacedBy: Map<string, string>
  /** Replacement → the target it superseded (the inverse of `replacedBy`). */
  replaces: Map<string, string>
  invalidTargets: Set<string>
  /** `${targetId}\u0000${observationId}`: observation ids are unique within a target. */
  invalidObservations: Set<string>
  invalidPresentations: Set<string>
}

const order = (a: Amendment, b: Amendment) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)

/**
 * Deterministic interpretation of the amendment log: the same result on every device, whatever order the records
 * arrived in. Two devices can amend the same target while disconnected; both amendments are kept and applied in
 * (time, id) order, so the later correction replaces the current one and one mistake never gets two schedules.
 */
export function amendmentView(state: Pick<EngineState, 'amendments'>): AmendmentView {
  const view: AmendmentView = {
    replacedBy: new Map(), replaces: new Map(), invalidTargets: new Set(), invalidObservations: new Set(), invalidPresentations: new Set(),
  }
  for (const a of [...state.amendments].sort(order)) {
    if (a.kind === 'amend_target' && a.refs.length === 1 && a.replacement_ref) {
      const to = a.replacement_ref
      if (view.replaces.has(to) || view.replacedBy.has(to)) continue // malformed or repeated: never a cycle
      let head = a.refs[0]
      for (let guard = 0; view.replacedBy.has(head) && guard < 10_000; guard++) head = view.replacedBy.get(head) as string
      if (head === to) continue
      view.replacedBy.set(head, to)
      view.replaces.set(to, head)
    } else if (a.kind === 'invalidate_target') for (const r of a.refs) view.invalidTargets.add(r)
    else if (a.kind === 'invalidate_observation' && a.refs.length === 2) view.invalidObservations.add(`${a.refs[0]}\u0000${a.refs[1]}`)
    else if (a.kind === 'invalidate_presentation') for (const r of a.refs) view.invalidPresentations.add(r)
  }
  return view
}

/**
 * A target's status after amendments (the stored record keeps the status it was created with). Invalidating any
 * version of a mistake invalidates the mistake: a correction made elsewhere does not bring it back.
 */
export function targetStatus(t: Target, view: AmendmentView): Target['status'] {
  if (t.status !== 'active') return t.status
  for (let at: string | undefined = t.id, guard = 0; at !== undefined && guard < 10_000; at = view.replaces.get(at), guard++) {
    if (view.invalidTargets.has(at)) return 'invalidated'
  }
  if (view.replacedBy.has(t.id)) return 'superseded'
  return 'active'
}

export const isActiveTarget = (t: Target, view: AmendmentView) => targetStatus(t, view) === 'active'

/**
 * An observation stops counting when it was invalidated on this target or on any target this one replaced: a
 * duplicate marked on one device still counts as a duplicate after another device corrected the target.
 */
export function observationInvalid(t: Target, o: Target['observations'][number], view: AmendmentView): boolean {
  if (o.invalidated) return true
  for (let at: string | undefined = t.id, guard = 0; at !== undefined && guard < 10_000; at = view.replaces.get(at), guard++) {
    if (view.invalidObservations.has(`${at}\u0000${o.id}`)) return true
  }
  return false
}

/** The target that now holds a (possibly amended) target's mistake: follows replacements, null when invalidated. */
export function currentTarget(state: Pick<EngineState, 'targets' | 'amendments'>, id: string, view = amendmentView(state)): Target | null {
  const seen = new Set<string>()
  let at = id
  for (;;) {
    if (seen.has(at)) return null
    seen.add(at)
    const t = state.targets.find((x) => x.id === at)
    if (!t) return null
    const status = targetStatus(t, view)
    if (status === 'active') return t
    if (status === 'invalidated') return null
    const next = view.replacedBy.get(at)
    if (!next) return null
    at = next
  }
}

/** Imported targets (at least one parent-confirmed observation) can be amended; app-caught ones are invalidated. */
export const isImported = (t: Target) => t.observations.some((o) => o.source_type !== 'app_practice')
