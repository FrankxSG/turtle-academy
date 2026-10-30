// Parent amendments (Functional Design §8; Learning Engine §5, F23/F51). Amendments are add-only records with
// provenance: the corrected or invalidated records themselves are never edited, and replay reads the amendments
// to decide which targets, observations and answers still count. Because amendments and new target records are
// add-only in sync (Pilot Scope §3 rules 1 and 5), every device that holds them derives the same progress.
import type { Amendment, EngineState, Target } from './types.ts'

/** Reducer revision that interprets the target/observation/answer amendments below. */
export const AMENDMENT_REVISION = 4

export type AmendReason = 'wrong_target' | 'wrong_skill' | 'wrong_error_type'
export type InvalidateReason = 'not_a_mistake' | 'duplicate' | 'question_problem'

export interface AmendmentView {
  /** Superseded target → its replacement. */
  replacedBy: Map<string, string>
  /**
   * Replacement → the targets it superseded (the inverse of `replacedBy`): the corrected target, and any other
   * records of the same mistake retired with it (two devices).
   */
  replaces: Map<string, string[]>
  invalidTargets: Set<string>
  /** Invalidated target → the latest "not a mistake" (or faulty question) decision on it. */
  dismissedAt: Map<string, string>
  /** Targets invalidated as a duplicate: never revived. */
  duplicateTargets: Set<string>
  /**
   * Dismissed records holding an observation made after the decision (another device added it before it saw the
   * decision) → that decision. Such a record is active again, for what came after only. Empty from amendmentView;
   * replay fills it (it needs learning dates): read statuses from `derive(...).view`.
   */
  revived: Map<string, Dismissal>
  /** `${targetId}\u0000${observationId}` → reason: observation ids are unique within a target. */
  invalidObservations: Map<string, Amendment['reason']>
  invalidPresentations: Set<string>
  /** Replacement target → when the correction that created it was made. */
  createdAt: Map<string, string>
}

const order = (a: Amendment, b: Amendment) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)

/**
 * Deterministic interpretation of the amendment log: the same result on every device, whatever order the records
 * arrived in. Two devices can amend the same target while disconnected; both amendments are kept and applied in
 * causal order, using (time, id) for unrelated corrections, so the later correction replaces the current one and one mistake never gets two schedules.
 */
export function amendmentView(state: Pick<EngineState, 'amendments'>): AmendmentView {
  const view: AmendmentView = {
    replacedBy: new Map(), replaces: new Map(), invalidTargets: new Set(), invalidObservations: new Map(), invalidPresentations: new Set(),
    createdAt: new Map(), dismissedAt: new Map(), duplicateTargets: new Set(), revived: new Map(),
  }
  // A correction of a replacement depends on the amendment that created it, even when a device clock
  // moves backwards. Timestamp/id only order unrelated ready amendments; they cannot reverse causality.
  const pending = [...state.amendments].sort(order)
  const creates = new Map(pending.filter((a) => a.kind === 'amend_target' && a.replacement_ref)
    .map((a) => [a.replacement_ref!, a]))
  while (pending.length > 0) {
    const index = pending.findIndex((a) => a.kind !== 'amend_target' || !a.refs.some((r) => creates.has(r)))
    if (index < 0) break // malformed cyclic dependencies cannot affect replay
    const [a] = pending.splice(index, 1)
    if (a.kind === 'amend_target' && a.replacement_ref) creates.delete(a.replacement_ref)
    if (a.kind === 'amend_target' && a.refs.length >= 1 && a.replacement_ref) {
      const to = a.replacement_ref
      if (view.replaces.has(to) || view.replacedBy.has(to)) continue // malformed or repeated: never a cycle
      // refs[0] is the corrected target; further refs are other records of the same mistake retired with it.
      // A record already corrected elsewhere is followed to its current head, so concurrent corrections chain.
      const supersedes: string[] = []
      for (const ref of a.refs) {
        let head = ref
        for (let guard = 0; view.replacedBy.has(head) && guard < 10_000; guard++) head = view.replacedBy.get(head) as string
        if (head === to || supersedes.includes(head)) continue
        view.replacedBy.set(head, to)
        supersedes.push(head)
      }
      if (supersedes.length > 0) { view.replaces.set(to, supersedes); view.createdAt.set(to, a.at) }
    } else if (a.kind === 'invalidate_target') for (const r of a.refs) {
      view.invalidTargets.add(r)
      if (a.reason === 'duplicate') view.duplicateTargets.add(r)
      else if (a.at > (view.dismissedAt.get(r) ?? '')) view.dismissedAt.set(r, a.at)
    }
    else if (a.kind === 'invalidate_observation' && a.refs.length === 2) {
      const key = `${a.refs[0]}\u0000${a.refs[1]}`
      // "Not a mistake" outranks "duplicate" whatever order they arrive in.
      if (view.invalidObservations.get(key) !== 'not_a_mistake') view.invalidObservations.set(key, a.reason)
    }
    else if (a.kind === 'invalidate_presentation') for (const r of a.refs) view.invalidPresentations.add(r)
  }
  return view
}

/** A target and every target it (transitively) replaced, nearest first. */
export function lineage(id: string, view: AmendmentView): string[] {
  const out = [id]
  for (let i = 0; i < out.length && out.length < 10_000; i++) {
    for (const prev of view.replaces.get(out[i]) ?? []) if (!out.includes(prev)) out.push(prev)
  }
  return out
}

/**
 * A target's status after amendments (the stored record keeps the status it was created with). Invalidating any
 * version of a mistake invalidates the mistake: a correction made elsewhere does not bring it back. A dismissed
 * record that holds an observation made after the decision is active again (`revived`, filled by replay).
 */
export function targetStatus(t: Target, view: AmendmentView): Target['status'] {
  if (t.status !== 'active') return t.status
  if (!view.revived.has(t.id)) for (const at of lineage(t.id, view)) if (view.invalidTargets.has(at)) return 'invalidated'
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
  for (const at of lineage(t.id, view)) {
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
  for (const at of lineage(t.id, view)) {
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
  return groupObservations([t.id], view, byId, counts)
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


/**
 * The progress unit of a mistake (Functional Design §4): subject, course, knowledge point, assessed skill and error
 * type. Two active targets with the same unit are the same mistake, for example when two devices each caught it
 * offline under their own random target ids, or a correction on one device met a mistake recorded on another.
 */
export const mistakeKey = (t: Target) => [t.subject, t.course, t.knowledge_point_ref ?? '', t.assessed_skill ?? '', t.error_type].join('\u0000')

export interface MistakeGroups {
  /** Every active target → the target that leads its group (the lowest id: the same on every device). */
  leader: Map<string, string>
  /** Leading target → every active target of its group, leader first. */
  members: Map<string, string[]>
}

/** Groups of active targets that are one mistake. Inactive (corrected or invalidated) targets are not grouped. */
export function mistakeGroups(state: Pick<EngineState, 'targets'>, view: AmendmentView): MistakeGroups {
  const byKey = new Map<string, string[]>()
  for (const t of state.targets) {
    if (!isActiveTarget(t, view)) continue
    const k = mistakeKey(t)
    byKey.set(k, [...(byKey.get(k) ?? []), t.id])
  }
  const leader = new Map<string, string>()
  const members = new Map<string, string[]>()
  for (const ids of byKey.values()) {
    ids.sort()
    members.set(ids[0], ids)
    for (const id of ids) leader.set(id, ids[0])
  }
  return { leader, members }
}

/** The target that leads the group holding `id` (or `id` itself when it is not an active target). */
export const leaderOf = (groups: MistakeGroups, id: string) => groups.leader.get(id) ?? id

/**
 * A parent's "not a mistake" (or "faulty question") decision on a mistake, by progress unit. Other records of the
 * same mistake made before it, for example on a device that had not synced, are covered too; a new error after it
 * starts a new mistake.
 */
export interface Dismissal {
  /** Learning date and instant of the decision. */
  on: string
  at: string
  /**
   * When an observation was made, if known (an app-caught error: its answer; an imported case: when its record was
   * confirmed). On the decision's own day this decides; without it the whole day counts as covered.
   */
  instantOf?: (o: Observation, holder: Target) => string | null
}

/** Is an observation covered by a decision: made before it (by day; by instant on the decision's own day)? */
function covered(d: Dismissal, o: Observation, holder: Target): boolean {
  if (o.recorded_on !== d.on) return o.recorded_on < d.on
  const at = d.instantOf?.(o, holder) ?? null
  return at === null || Date.parse(at) <= Date.parse(d.at)
}

/**
 * Decisions by progress unit (mistakeKey): the latest one. `dateOf` gives the learning date of an instant (the
 * engine's DateBook), so a decision covers observations recorded on or before its learning day.
 */
export function dismissals(state: Pick<EngineState, 'targets' | 'amendments'>, dateOf: (at: string) => string): Map<string, Dismissal> {
  const byId = targetsById(state)
  const out = new Map<string, Dismissal>()
  for (const a of state.amendments) {
    if (a.kind !== 'invalidate_target' || a.reason === 'duplicate') continue
    for (const ref of a.refs) {
      const t = byId.get(ref)
      if (!t) continue
      const k = mistakeKey(t)
      const prev = out.get(k)
      if (!prev || a.at > prev.at) out.set(k, { on: dateOf(a.at), at: a.at })
    }
  }
  return out
}

/**
 * All counting observations of a mistake group: each member's own and its correction chain's, once by id. The
 * duplicate rule applies once across the whole group, so marking a case that is the only one on its record works.
 * `dismissal` drops observations made before a decision on this mistake (a member created by a correction made
 * after the decision keeps its own).
 */
export function groupObservations(ids: readonly string[], view: AmendmentView, byId: ReadonlyMap<string, Target>,
  counts: (o: Observation) => boolean = () => true, dismissal?: Dismissal): Observation[] {
  const all = new Map<string, { o: Observation; holder: Target }>()
  for (const id of ids) {
    const t = byId.get(id)
    if (!t) continue
    // A correction made after the decision starts afresh, unless it is a dismissed record's correction brought back by
    // a later case (`revived`): then the decision still covers what it carried over.
    const exempt = dismissal !== undefined && !view.revived.has(id) && (view.createdAt.get(id) ?? '') > dismissal.at
    // A correction copies observations with its own date: an observation is covered when any copy of it in the
    // correction chain was made before the decision (the original was).
    const copies = new Map<string, { o: Observation; holder: Target }[]>()
    if (dismissal && !exempt) for (const at of lineage(id, view)) for (const o of byId.get(at)?.observations ?? []) {
      const holder = byId.get(at) as Target
      copies.set(o.id, [...(copies.get(o.id) ?? []), { o, holder }])
    }
    for (const o of chainObservations(t, view, byId)) {
      if (all.has(o.id) || !counts(o)) continue
      if (dismissal && !exempt && (copies.get(o.id) ?? [{ o, holder: t }]).some((c) => covered(dismissal, c.o, c.holder))) continue
      all.set(o.id, { o, holder: t })
    }
  }
  const list = [...all.values()]
  const valid = list.filter(({ o, holder }) => !observationInvalid(holder, o, view)).map(({ o }) => o)
  if (valid.length > 0) return valid
  // Only when every case was marked a duplicate: a duplicate of a case that is "not a mistake" is not one either.
  // An observation with the legacy `invalidated` flag (never set by this app) counts as not a mistake here.
  if (list.length === 0 || !list.every(({ o, holder }) => !o.invalidated && observationMark(holder, o, view) === 'duplicate')) return []
  return list.map(({ o }) => o).sort((a, b) => a.id.localeCompare(b.id)).slice(0, 1)
}

/** The later of two decisions (by instant, then learning date). */
export function laterDismissal(a: Dismissal | undefined, b: Dismissal | undefined): Dismissal | undefined {
  if (!a) return b
  if (!b) return a
  return b.at > a.at ? b : a
}

/**
 * Dismissed records that hold an observation made after the decision that dismissed them: another device, which had
 * not yet seen the decision, added a new case or app-caught error to the record (the decision covers what came
 * before it only, and anything after starts afresh). Only an observation recorded on a later learning day than the
 * decision brings the record back: on the decision's own day the decision wins, because instants from two device
 * clocks cannot safely order a record against a decision that already named it. Every copy of an observation is
 * judged (a correction copies them with its own date), so a correction of a dismissed record never brings back what
 * the decision covered. A record invalidated as a duplicate, or superseded, is never revived. `decision` gives a
 * decision's learning date and instants (replay's DateBook).
 */
export function revivals(state: Pick<EngineState, 'targets'>, view: AmendmentView, byId: ReadonlyMap<string, Target>,
  counts: (o: Observation) => boolean, decision: (at: string) => Dismissal): Map<string, Dismissal> {
  const out = new Map<string, Dismissal>()
  for (const t of state.targets) {
    if (t.status !== 'active' || view.replacedBy.has(t.id)) continue
    const line = lineage(t.id, view)
    if (!line.some((id) => view.invalidTargets.has(id)) || line.some((id) => view.duplicateTargets.has(id))) continue
    const at = line.reduce((max, id) => { const x = view.dismissedAt.get(id) ?? ''; return x > max ? x : max }, '')
    if (!at) continue
    const d = decision(at)
    const copies = new Map<string, { o: Observation; holder: Target }[]>()
    for (const id of line) for (const o of byId.get(id)?.observations ?? []) copies.set(o.id, [...(copies.get(o.id) ?? []), { o, holder: byId.get(id)! }])
    const after = chainObservations(t, view, byId).some((o) => {
      const all = copies.get(o.id) ?? []
      return all.some((c) => counts(c.o) && !observationInvalid(c.holder, c.o, view)) && all.every((c) => c.o.recorded_on > d.on)
    })
    if (after) out.set(t.id, d)
  }
  return out
}

/** Every observation recorded on a mistake group, valid or not (whether it ever had any). */
export function groupChainObservations(ids: readonly string[], view: AmendmentView, byId: ReadonlyMap<string, Target>): Observation[] {
  return ids.flatMap((id) => { const t = byId.get(id); return t ? chainObservations(t, view, byId) : [] })
}
