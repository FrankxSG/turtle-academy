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
  /** `${targetId}\u0000${observationId}` → reason: observation ids are unique within a target. */
  invalidObservations: Map<string, Amendment['reason']>
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
    replacedBy: new Map(), replaces: new Map(), invalidTargets: new Set(), invalidObservations: new Map(), invalidPresentations: new Set(),
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
    else if (a.kind === 'invalidate_observation' && a.refs.length === 2) {
      const key = `${a.refs[0]}\u0000${a.refs[1]}`
      // "Not a mistake" outranks "duplicate" whatever order they arrive in.
      if (view.invalidObservations.get(key) !== 'not_a_mistake') view.invalidObservations.set(key, a.reason)
    }
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
  return o.invalidated || observationMark(t, o, view) !== null
}

function observationMark(t: Target, o: Target['observations'][number], view: AmendmentView): Amendment['reason'] | null {
  let mark: Amendment['reason'] | null = null
  for (let at: string | undefined = t.id, guard = 0; at !== undefined && guard < 10_000; at = view.replaces.get(at), guard++) {
    const m = view.invalidObservations.get(`${at}\u0000${o.id}`)
    if (m !== undefined && mark !== 'not_a_mistake') mark = m
  }
  return mark
}

type Observation = Target['observations'][number]

/**
 * Every observation of a mistake: the target's own and those of the targets it replaced (its own copy wins by id).
 * A device that had not yet seen a correction may add an observation to the original; it still belongs to the
 * mistake, so it counts on the replacement once both records meet.
 */
export function chainObservations(t: Target, view: AmendmentView, byId: ReadonlyMap<string, Target>): Observation[] {
  const out = new Map<string, Observation>()
  for (let at: string | undefined = t.id, guard = 0; at !== undefined && guard < 10_000; at = view.replaces.get(at), guard++) {
    const holder = byId.get(at)
    // An app-caught error is about the question's own point: it follows a correction only when the knowledge point
    // and skill are unchanged. (A parent-confirmed case is the mistake being corrected, so it always follows.)
    const samePoint = holder !== undefined && holder.knowledge_point_ref === t.knowledge_point_ref && holder.assessed_skill === t.assessed_skill
    for (const o of holder?.observations ?? []) {
      if (out.has(o.id) || (o.source_type === 'app_practice' && !samePoint)) continue
      out.set(o.id, o)
    }
  }
  return [...out.values()]
}

/**
 * The observations that count after amendments. Marking cases duplicates of each other never removes the last one
 * (two devices can each mark the other case before syncing): when every case is marked a duplicate, the lowest id
 * stays. "Not a mistake" on any of them, or on the target, removes the mistake.
 */
export function validObservations(t: Target, view: AmendmentView, byId: ReadonlyMap<string, Target>,
  counts: (o: Observation) => boolean = () => true): Observation[] {
  // `counts` drops observations that stop counting for other reasons (an app-caught error whose question was
  // flagged); the duplicate rule then looks only at the cases that remain.
  const all = chainObservations(t, view, byId).filter(counts)
  const valid = all.filter((o) => !observationInvalid(t, o, view))
  if (valid.length > 0) return valid
  // Only when every case was marked a duplicate: a duplicate of a case that is "not a mistake" is not one either.
  // An observation with the legacy `invalidated` flag (never set by this app) counts as not a mistake here.
  if (all.length === 0 || !all.every((o) => !o.invalidated && observationMark(t, o, view) === 'duplicate')) return []
  return [...all].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 1)
}

export const targetsById = (state: Pick<EngineState, 'targets'>) => new Map(state.targets.map((t) => [t.id, t]))

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

