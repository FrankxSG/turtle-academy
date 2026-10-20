// Task planning and slot resolution (Functional Design §2–5).
// The plan freezes subject X, content and policy versions, the material structure and the formal total.
// Short review/repair/general slots resolve their item when presented, so short-only repair can advance
// within the same task; the item is frozen once presented.
import type { CatalogueItem, CatalogueRelease, Pool } from '../catalogue/adapter.ts'
import { daysBetween } from './calendar.ts'
import { completedKnowledgePoints, isEligible, type Derived, type TargetProgress } from './evidence.ts'
import { isLanguage, isPractisable, languagePrescribedShortMax, minMaterials, SCIENCE_FILLER_EXCLUSION_DAYS } from './policy.ts'
import type { EngineState, PlanMaterial, PlanSlot, Role, Stage, Subject, Target, Task } from './types.ts'

export interface PlanResult {
  materials: PlanMaterial[]
  slots: PlanSlot[]
  plannedTotal: number
  newTargets: Target[]
}

export interface PlanContext {
  state: EngineState
  derived: Derived
  release: CatalogueRelease
  subject: Subject
  date: string
  x: number
  newId: () => string
  /**
   * Targets set aside for now (e.g. their private mistake pack no longer fits this app). They keep their records
   * but are never newly scheduled, so no slot is planned or resolved for them until they are released.
   */
  held?: ReadonlySet<string>
}

const key = (id: string, v: number) => `${id}@${v}`

/** Item versions (and whole items) suspended for this child. */
export function suspendedSet(state: EngineState): { versions: Set<string>; items: Set<string> } {
  const versions = new Set<string>()
  const items = new Set<string>()
  for (const s of state.suspensions) {
    if (s.restored_at !== null) continue
    if (s.item_version === null) items.add(s.item_id)
    else versions.add(key(s.item_id, s.item_version))
  }
  return { versions, items }
}

/** Is this exact item version still free of any child suspension? */
export function usableVersion(state: EngineState, itemId: string, version: number): boolean {
  const s = suspendedSet(state)
  return !s.items.has(itemId) && !s.versions.has(key(itemId, version))
}

export function usableItem(state: EngineState, item: CatalogueItem): boolean {
  const s = suspendedSet(state)
  return isPractisable(item.course) && !s.items.has(item.id) && !s.versions.has(key(item.id, item.version))
}

const isRepairStage = (s: Stage): boolean => s === 'exact' || s === 'similar' || s === 'generic'

function eligibleTargets(ctx: PlanContext, excludeTargets: Set<string> = new Set()) {
  const list = [...ctx.derived.progress.values()].filter((pr) =>
    pr.target.subject === ctx.subject && pr.target.knowledge_point_ref !== null && isPractisable(pr.target.course)
    && !excludeTargets.has(pr.target.id) && !ctx.held?.has(pr.target.id) && pr.stage !== 'acquisition' && isEligible(pr, ctx.date))
  const reviews = list.filter((pr) => pr.stage === 'delayed_review').sort((a, b) => (a.dueOn ?? '').localeCompare(b.dueOn ?? ''))
  const repairs = list.filter((pr) => isRepairStage(pr.stage)).sort((a, b) =>
    (b.lastIndependentObservationOn ?? '').localeCompare(a.lastIndependentObservationOn ?? '') || a.target.id.localeCompare(b.target.id))
  return { reviews, repairs }
}

function lastPresented(state: EngineState, itemId: string): string | null {
  return state.exposure.find((e) => e.item_id === itemId)?.last_presented_on ?? null
}

/** Fresh items first, then the least recently presented. */
function byFreshness(state: EngineState, items: CatalogueItem[]): CatalogueItem[] {
  return [...items].sort((a, b) => (lastPresented(state, a.id) ?? '').localeCompare(lastPresented(state, b.id) ?? '') || a.id.localeCompare(b.id))
}

/** The ladder pool that assesses a stage (delayed checks use the generic transfer pool). */
export function poolForStage(stage: Stage): Pool | null {
  if (stage === 'exact' || stage === 'similar' || stage === 'generic' || stage === 'acquisition') return stage
  if (stage === 'delayed_review') return 'generic'
  return null
}

/**
 * The one compatibility rule for crediting a question to a target (material coverage, attachment, short
 * repair and replacements): same subject, course and knowledge point, the same assessed skill (a missing
 * skill on either side matches only a missing skill, never acts as a wildcard), and a pool for the stage.
 */
export function compatibleItem(target: Target, stage: Stage, item: CatalogueItem): boolean {
  const pool = poolForStage(stage)
  return pool !== null && item.subject === target.subject && item.course === target.course
    && item.knowledge_point_ref === target.knowledge_point_ref && item.assessed_skill === target.assessed_skill
    && item.pools.includes(pool)
}

export function itemsForStage(ctx: PlanContext, pr: TargetProgress, task: Task | null): CatalogueItem[] {
  const inTask = new Set(task ? ctx.state.presentations.filter((p) => p.task_id === task.id).map((p) => p.item_id) : [])
  const candidates = ctx.release.items.filter((i) => i.material_ref === null && compatibleItem(pr.target, pr.stage, i)
    && usableItem(ctx.state, i) && !inTask.has(i.id) && !pr.lowSuccessItems.includes(i.id))
  return byFreshness(ctx.state, candidates)
}

/** Knowledge points the child has been taught (Science general practice must not be untaught filler). */
function learnedKnowledgePoints(ctx: PlanContext): Set<string> {
  const out = new Set<string>()
  for (const pr of ctx.derived.progress.values()) {
    if (pr.target.subject === ctx.subject && pr.target.knowledge_point_ref && (pr.stage !== 'acquisition' || pr.acquisitionSuccessItems.length > 0)) {
      out.add(pr.target.knowledge_point_ref)
    }
  }
  return out
}

export function generalItems(ctx: PlanContext, task: Task | null, alsoExclude: Set<string> = new Set()): CatalogueItem[] {
  const inTask = new Set(task ? ctx.state.presentations.filter((p) => p.task_id === task.id).map((p) => p.item_id) : [])
  const science = ctx.subject === 'science'
  const learned = science ? learnedKnowledgePoints(ctx) : null
  const candidates = ctx.release.items.filter((i) => {
    if (!i.pools.includes('general') || i.material_ref !== null || !usableItem(ctx.state, i) || inTask.has(i.id) || alsoExclude.has(i.id)) return false
    if (learned && !learned.has(i.knowledge_point_ref)) return false
    if (science) {
      // Filler excludes items presented on any of the previous seven calendar days (day 7 excluded, day 8 eligible).
      const last = lastPresented(ctx.state, i.id)
      if (last !== null && daysBetween(last, ctx.date) <= SCIENCE_FILLER_EXCLUSION_DAYS) return false
    }
    return true
  })
  return byFreshness(ctx.state, candidates)
}

export interface AcquisitionUnit { kp: string; target: Target | null; testItems: CatalogueItem[]; teaching: boolean }

/** Next Science knowledge point to learn: syllabus order, prerequisites completed, not yet acquired. */
export function nextAcquisitionUnits(ctx: PlanContext, planned: Set<string>): AcquisitionUnit | null {
  const completed = completedKnowledgePoints(ctx.derived.progress)
  const kps = [...ctx.release.knowledge_points].filter((k) => isPractisable(k.course) && !planned.has(k.ref)).sort((a, b) => a.order - b.order)
  for (const kp of kps) {
    if (!kp.prerequisites.every((p) => completed.has(p))) continue
    const pr = [...ctx.derived.progress.values()].find((p) => p.target.subject === 'science' && p.target.knowledge_point_ref === kp.ref && p.target.error_type === 'none')
    if (pr && (pr.stage !== 'acquisition' || pr.blockedByTask !== null || (pr.notBefore !== null && ctx.date < pr.notBefore))) continue
    const succeeded = new Set(pr?.acquisitionSuccessItems ?? [])
    const succeededContexts = new Set(ctx.release.items.filter((i) => succeeded.has(i.id)).map((i) => i.context_ref))
    const needed = 2 - succeeded.size
    const pool = byFreshness(ctx.state, ctx.release.items.filter((i) => i.knowledge_point_ref === kp.ref && i.pools.includes('acquisition')
      && usableItem(ctx.state, i) && !succeeded.has(i.id) && !succeededContexts.has(i.context_ref)))
    const tests: CatalogueItem[] = []
    for (const i of pool) {
      if (tests.length >= needed) break
      if (!tests.some((t) => t.context_ref === i.context_ref)) tests.push(i)
    }
    if (tests.length < needed) continue
    return { kp: kp.ref, target: pr?.target ?? null, testItems: tests, teaching: succeeded.size === 0 }
  }
  return null
}

function slot(position: number, kind: PlanSlot['kind'], role: PlanSlot['role'], opts: Partial<PlanSlot> = {}): PlanSlot {
  return {
    position, kind, role, material_ref: null, item_id: null, item_version: null, target_ref: null, stage: null,
    counts_toward_x: role !== 'teaching', ...opts,
  }
}

export function planTask(ctx: PlanContext): PlanResult {
  const { state, release, x } = ctx
  const slots: PlanSlot[] = []
  const materials: PlanMaterial[] = []
  const newTargets: Target[] = []
  const { reviews, repairs } = eligibleTargets(ctx)
  const prescribed = [...reviews, ...repairs]
  const roleOf = (pr: TargetProgress): Role => (pr.stage === 'delayed_review' ? 'delayed_review' : 'repair')

  if (isLanguage(ctx.subject)) {
    const itemById = new Map(release.items.map((i) => [i.id, i]))
    const usableMaterials = release.materials.filter((m) => isPractisable(m.course)
      && m.question_ids.every((q) => { const i = itemById.get(q); return i !== undefined && usableItem(state, i) }))
    const coverOf = (m: (typeof usableMaterials)[number]) => prescribed.filter((pr) =>
      m.question_ids.some((q) => { const i = itemById.get(q); return i !== undefined && compatibleItem(pr.target, pr.stage, i) }))
    const previous = [...state.tasks].filter((t) => t.subject === ctx.subject).pop()
    const recentFamilies = new Set(previous?.plan.materials.map((m) => m.family) ?? [])
    const freshness = (m: (typeof usableMaterials)[number]) => m.question_ids.map((q) => lastPresented(state, q) ?? '').sort().pop() ?? ''
    const ranked = [...usableMaterials].sort((a, b) => coverOf(b).length - coverOf(a).length
      || Number(recentFamilies.has(a.family)) - Number(recentFamilies.has(b.family))
      || freshness(a).localeCompare(freshness(b)) || a.ref.localeCompare(b.ref))
    const covered = new Set<string>()
    const chosen: typeof usableMaterials = []
    let total = 0
    const need = minMaterials(x)
    // Rotate families: avoid repeating a family within the task while alternatives exist.
    const pick = (requireCoverage: boolean) => {
      for (const m of ranked) {
        if (chosen.includes(m)) continue
        const newCover = coverOf(m).filter((pr) => !covered.has(pr.target.id))
        if (requireCoverage && (newCover.length === 0 || total >= x)) continue
        if (!requireCoverage && chosen.length >= need) return
        const familyUsed = chosen.some((c) => c.family === m.family)
        const alternative = ranked.some((o) => !chosen.includes(o) && o !== m && !chosen.some((c) => c.family === o.family)
          && (!requireCoverage || coverOf(o).some((pr) => !covered.has(pr.target.id))))
        if (familyUsed && alternative) continue
        chosen.push(m)
        total += m.question_ids.length
        for (const pr of newCover) covered.add(pr.target.id)
      }
    }
    pick(true)
    pick(false)
    if (chosen.length < need) pick(false)
    // Short review/repair questions for targets that no material covers come FIRST in the task (owner instruction
    // 2026-10-18: eligible review and mistake repair precede general practice): due reviews, then mistake repair.
    // One slot per target first; then a second slot for repair targets, so short-only repair can clear two stages
    // in a day. Capped by policy so they never become a full extra short quota on top of the materials.
    const materialQuestions = chosen.reduce((n, m) => n + m.question_ids.length, 0)
    const cap = languagePrescribedShortMax(x, materialQuestions)
    const uncovered = prescribed.filter((pr) => !covered.has(pr.target.id))
    const shortPlan = [...uncovered, ...uncovered.filter((pr) => pr.stage !== 'delayed_review')].slice(0, cap)
    const order = new Map(uncovered.map((pr, i) => [pr.target.id, i]))
    shortPlan.sort((a, b) => (order.get(a.target.id) as number) - (order.get(b.target.id) as number))
    for (const pr of shortPlan) slots.push(slot(slots.length, 'short', roleOf(pr), { target_ref: pr.target.id, stage: pr.stage }))
    for (const m of chosen) {
      materials.push({ material_ref: m.ref, material_version: m.version, family: m.family, question_count: m.question_ids.length })
      for (const q of m.question_ids) {
        const item = itemById.get(q) as CatalogueItem
        const pr = prescribed.find((p) => covered.has(p.target.id) && compatibleItem(p.target, p.stage, item))
        slots.push(slot(slots.length, 'material_question', 'material_question', {
          material_ref: m.ref, item_id: item.id, item_version: item.version,
          target_ref: pr?.target.id ?? null, stage: pr?.stage ?? null,
        }))
      }
    }
    while (slots.length < x) slots.push(slot(slots.length, 'short', 'general_practice'))
    return { materials, slots, plannedTotal: slots.filter((s) => s.counts_toward_x).length, newTargets }
  }

  // Mathematics and Science: X formal short slots.
  const units: AcquisitionUnit[] = []
  if (ctx.subject === 'science') {
    const planned = new Set<string>()
    const first = nextAcquisitionUnits(ctx, planned)
    if (first) { units.push(first); planned.add(first.kp) }
  }
  const reserve = units.reduce((n, u) => n + u.testItems.length, 0)
  const prescribedSlots: PlanSlot[] = []
  for (const pr of reviews) prescribedSlots.push(slot(0, 'short', 'delayed_review', { target_ref: pr.target.id, stage: pr.stage }))
  // Two slots per repair target let a low-option stage clear, or short-only repair advance within capacity.
  for (const pr of repairs) for (let i = 0; i < 2; i++) prescribedSlots.push(slot(0, 'short', 'repair', { target_ref: pr.target.id, stage: pr.stage }))
  for (const s of prescribedSlots.slice(0, Math.max(0, x - reserve))) slots.push({ ...s, position: slots.length })

  const addUnit = (u: AcquisitionUnit) => {
    let target = u.target
    if (!target) {
      const kp = release.knowledge_points.find((k) => k.ref === u.kp)
      target = {
        id: ctx.newId(), subject: 'science', course: 'p3_science', target_kind: kp?.target_kind ?? 'science_concept',
        knowledge_point_ref: u.kp, target_value: null, assessed_skill: null, error_type: 'none',
        mapping_status: 'mapped', verification: 'verified', status: 'active', verified_at: null, replaces: null, observations: [],
      }
      newTargets.push(target)
    }
    if (u.teaching) slots.push(slot(slots.length, 'teaching', 'teaching', { target_ref: target.id, stage: 'acquisition' }))
    for (const i of u.testItems) {
      slots.push(slot(slots.length, 'short', 'acquisition_test', { item_id: i.id, item_version: i.version, target_ref: target.id, stage: 'acquisition' }))
    }
  }
  for (const u of units) addUnit(u)
  // With no review eligible and capacity left, continue another small unlocked point (teaching plus two tests).
  if (ctx.subject === 'science' && reviews.length === 0) {
    const planned = new Set(units.map((u) => u.kp))
    for (;;) {
      const formal = slots.filter((s) => s.counts_toward_x).length
      if (x - formal < 2) break
      const u = nextAcquisitionUnits(ctx, planned)
      if (!u) break
      planned.add(u.kp)
      addUnit(u)
    }
  }
  const formal = () => slots.filter((s) => s.counts_toward_x).length
  // Science: knowledge points taught earlier in this task become learned filler, so general slots are planned
  // up to X and resolved when shown; any slot left without eligible content shortens the task.
  const generalAvailable = ctx.subject === 'science' ? x : generalItems(ctx, null).length
  let general = 0
  while (formal() < x && general < generalAvailable) { slots.push(slot(slots.length, 'short', 'general_practice')); general++ }
  return { materials, slots, plannedTotal: formal(), newTargets }
}

/** Resolve a short slot when it is presented. Returns null when no eligible content remains. */
export function resolveShortSlot(ctx: PlanContext, task: Task, s: PlanSlot, wholeTaskTargets: Set<string>):
  { item: CatalogueItem; role: Role; target: TargetProgress | null } | null {
  if (s.role === 'acquisition_test' && s.item_id !== null && s.target_ref !== null) {
    const pr = ctx.derived.progress.get(s.target_ref)
    const item = ctx.release.items.find((i) => i.id === s.item_id && i.version === s.item_version)
    // After a wrong first acquisition test, a same-day second test cannot be acquisition evidence.
    if (pr && pr.stage === 'acquisition' && pr.blockedByTask === null && item && usableItem(ctx.state, item)) return { item, role: 'acquisition_test', target: pr }
    if (pr && pr.stage === 'acquisition' && pr.blockedByTask === null) {
      const alt = byFreshness(ctx.state, ctx.release.items.filter((i) => i.knowledge_point_ref === pr.target.knowledge_point_ref
        && i.pools.includes('acquisition') && usableItem(ctx.state, i) && !pr.acquisitionSuccessItems.includes(i.id)
        && !ctx.state.presentations.some((p) => p.task_id === task.id && p.item_id === i.id)))[0]
      if (alt) return { item: alt, role: 'acquisition_test', target: pr }
    }
  } else if (s.role === 'repair' || s.role === 'delayed_review' || s.role === 'replacement' || s.role === 'material_question') {
    const { reviews, repairs } = eligibleTargets(ctx, wholeTaskTargets)
    const planned = s.target_ref && !ctx.held?.has(s.target_ref) ? ctx.derived.progress.get(s.target_ref) : undefined
    const order: TargetProgress[] = []
    // A replacement for a material question keeps its target; the whole-task aggregate still applies.
    if (planned && (isEligible(planned, ctx.date) || (s.role === 'material_question' && wholeTaskTargets.has(planned.target.id)))) order.push(planned)
    for (const pr of [...reviews, ...repairs]) if (!order.includes(pr)) order.push(pr)
    for (const pr of order) {
      const item = itemsForStage(ctx, pr, task)[0]
      if (item) return { item, role: pr.stage === 'delayed_review' ? 'delayed_review' : 'repair', target: pr }
    }
  }
  const item = generalItems(ctx, task)[0]
  return item ? { item, role: 'general_practice', target: null } : null
}

/** True when the subject has nothing at all to offer today (zero-eligible day). */
export function nothingEligible(ctx: PlanContext, plan: PlanResult): boolean {
  if (plan.slots.some((s) => s.role !== 'general_practice')) return false
  return generalItems(ctx, null).length === 0
}
