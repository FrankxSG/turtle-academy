// The on-device learning engine (Issue #17). One instance per child profile.
// Truth is the append-only answer events plus immutable records; progress is re-derived after every change.
import { itemIn, judge, type CatalogueItem, type CatalogueRegistry, type CatalogueRelease } from '../catalogue/adapter.ts'
import { isValidTimezone, learningDate } from './calendar.ts'
import { derive, type Derived } from './evidence.ts'
import { compatibleItem, nothingEligible, planTask, resolveShortSlot, usableItem, usableVersion, type PlanContext } from './planner.ts'
import type { Mutation, Put, RecordStore, SaveStatus, Table } from './persistence.ts'
import { WriteQueue } from './persistence.ts'
import { halfwayOf, IDLE_AFTER_SECONDS, isLanguage, isValidX, POLICY_VERSION, SUBJECTS } from './policy.ts'
import { emptyState, fromRecords, toRecords } from './records.ts'
import type {
  ActivityState, Assistance, Checkpoint, Completion, EngineState, Flag, PlanSlot, Presentation, Response, Role, Subject, Target, Task,
} from './types.ts'

export interface EngineDeps {
  registry: CatalogueRegistry
  /** Injectable clock (ISO instant). */
  now: () => string
  /** Opaque lowercase identifiers. */
  newId?: () => string
  /** Local persistence; omitted only in pure unit tests. */
  writer?: WriteQueue | null
}

export type Step =
  | { kind: 'teaching'; taskId: string; position: number; knowledgePointRef: string; teachingRef: string | null }
  | { kind: 'question'; taskId: string; presentation: Presentation; item: CatalogueItem; awaiting: 'first' | 'retry' | 'correction'; help: Assistance; feedbackWithheld: boolean }
  | { kind: 'done'; taskId: string; completion: Completion }

export interface AnswerResult {
  /** null while material feedback is withheld until every first response in the material is in. */
  correct: boolean | null
  next: 'continue' | 'retry' | 'correction'
  saved: SaveStatus | null
}

export type StartResult =
  | { kind: 'task'; task: Task; resumed: boolean }
  | { kind: 'zero_eligible'; completion: Completion }
  | { kind: 'already_complete' }

/** Help shown after a wrong first response, then after a wrong retry (Functional Design §4). */
const HELP: Record<Subject, { retry: Assistance; correction: Assistance }> = {
  chinese: { retry: 'hint', correction: 'answer_and_explanation' },
  science: { retry: 'hint', correction: 'answer_and_explanation' },
  mathematics: { retry: 'hint', correction: 'worked_steps' },
  english: { retry: 'hint', correction: 'answer_and_explanation' },
}

const defaultId = () => crypto.randomUUID()

export class LearningEngine {
  state: EngineState
  private readonly deps: EngineDeps
  private readonly newId: () => string
  private cache: Derived | null = null
  private readonly persisted = new Map<string, string>()
  private pendingEvents: EngineState['events'] = []
  private order = 0
  private readonly lastTouch = new Map<string, number>()

  constructor(state: EngineState, deps: EngineDeps) {
    this.state = state
    this.deps = deps
    this.newId = deps.newId ?? defaultId
    for (const p of toRecords(state)) this.persisted.set(`${p.table}\u0000${p.key}`, JSON.stringify(p.value))
  }

  static fresh(timezone: string, deps: EngineDeps): LearningEngine {
    if (!isValidTimezone(timezone)) throw new RangeError('invalid timezone')
    const e = new LearningEngine(emptyState(timezone, SUBJECTS), deps)
    e.persisted.clear()
    return e
  }

  /** Rebuild from local records (e.g. after reload). Derived state is recomputed, never loaded. */
  static async load(store: RecordStore, timezone: string, deps: EngineDeps): Promise<LearningEngine> {
    const stored = await store.load()
    const fallback = emptyState(timezone, SUBJECTS)
    const engine = new LearningEngine(stored.records.length > 0 ? fromRecords(stored, fallback) : fallback, deps)
    if (stored.records.length === 0) engine.persisted.clear()
    return engine
  }

  // ---------------------------------------------------------------- derived views

  derived(): Derived {
    if (!this.cache) this.cache = derive(this.state)
    return this.cache
  }

  private changed() {
    this.cache = null
  }

  /** The current learning date; advances the never-backwards guard. */
  today(): string {
    const d = learningDate(this.deps.now(), this.state.settings, this.state.calendar_guards)
    const g = this.state.calendar_guards
    if (g.max_local_date_seen === null || d > g.max_local_date_seen) g.max_local_date_seen = d
    return d
  }

  xFor(subject: Subject): number {
    return this.state.settings.subjects.find((s) => s.subject === subject)?.x ?? 10
  }

  availableSubjects(): Subject[] {
    return SUBJECTS.filter((s) => this.deps.registry.current(s) !== null)
  }

  dailyStatus() {
    const date = this.today()
    const rest = this.state.rest_days.includes(date)
    const subjects = this.availableSubjects().map((subject) => ({
      subject,
      complete: this.state.completions.some((c) => c.subject === subject && c.local_date === date),
    }))
    return { date, rest, subjects, explorationUnlocked: rest || (subjects.length > 0 && subjects.every((s) => s.complete)) }
  }

  // ---------------------------------------------------------------- parent settings (PIN gate is in the UI layer)

  async setX(subject: Subject, x: number): Promise<SaveStatus | null> {
    if (!isValidX(x)) throw new RangeError('X must be an integer from 6 to 19')
    const entry = this.state.settings.subjects.find((s) => s.subject === subject)
    if (!entry) throw new RangeError('unknown subject')
    entry.x = x
    entry.changed_at = this.deps.now()
    return this.flush()
  }

  async setTimezone(timezone: string): Promise<SaveStatus | null> {
    if (!isValidTimezone(timezone)) throw new RangeError('invalid timezone')
    if (timezone === this.state.settings.timezone) return null
    this.today() // record the latest date seen under the old zone first
    const now = this.deps.now()
    this.state.settings.timezone_history.push({ from_timezone: this.state.settings.timezone, timezone, changed_at: now })
    this.state.settings.timezone = timezone
    this.state.calendar_guards.last_timezone_change_at = now
    this.changed()
    return this.flush()
  }

  /** "Today is a rest day": exploration opens; X, progress and unfinished tasks are untouched; no credit. */
  async setRestDay(): Promise<SaveStatus | null> {
    const date = this.today()
    if (!this.state.rest_days.includes(date)) this.state.rest_days.push(date)
    return this.flush()
  }

  // ---------------------------------------------------------------- tasks

  private release(task: Task): CatalogueRelease {
    return this.deps.registry.release(task.subject, task.content_version)
  }

  private ctx(subject: Subject, release: CatalogueRelease, x: number): PlanContext {
    return { state: this.state, derived: this.derived(), release, subject, date: this.today(), x, newId: this.newId }
  }

  openTask(subject: Subject): Task | null {
    return this.state.tasks.find((t) => t.subject === subject && t.status !== 'finalised') ?? null
  }

  /**
   * Start today's task for a subject, or resume an unfinished one (even from an earlier day: finishing it
   * satisfies today's requirement; no historical catch-up tasks are created).
   */
  async startOrResume(subject: Subject, opts: { optional?: boolean } = {}): Promise<StartResult> {
    const open = this.openTask(subject)
    if (open) {
      if (open.status === 'paused') await this.resume(open.id)
      return { kind: 'task', task: open, resumed: true }
    }
    const date = this.today()
    if (!opts.optional && this.state.completions.some((c) => c.subject === subject && c.local_date === date)) return { kind: 'already_complete' }
    const release = this.deps.registry.current(subject)
    if (!release) throw new Error(`no content for ${subject}`)
    const x = this.xFor(subject)
    const ctx = this.ctx(subject, release, x)
    const plan = planTask(ctx)
    if (plan.plannedTotal === 0 || nothingEligible(ctx, plan)) {
      const completion: Completion = { subject, local_date: date, task_id: null, reason: 'zero_eligible', answered: 0 }
      if (!this.state.completions.some((c) => c.subject === subject && c.local_date === date)) this.state.completions.push(completion)
      await this.flush()
      return { kind: 'zero_eligible', completion }
    }
    const now = this.deps.now()
    this.state.targets.push(...plan.newTargets)
    const task: Task = {
      id: this.newId(), subject, local_date: date, created_at: now, finalised_at: null, x, policy_version: POLICY_VERSION,
      content_version: release.version, status: 'active', plan: { materials: plan.materials, slots: plan.slots },
      planned_total: plan.plannedTotal, cursor: 0, active_seconds: 0, activity: [{ state: 'active', at: now }], target_aggregates: [],
    }
    this.state.tasks.push(task)
    this.lastTouch.set(task.id, Date.parse(now))
    const cv = this.state.content_versions.find((c) => c.subject === subject)
    if (cv) { cv.catalogue_version = release.version; cv.manifest_version = release.manifest_version }
    else this.state.content_versions.push({ subject, catalogue_version: release.version, manifest_version: release.manifest_version })
    this.changed()
    await this.flush()
    return { kind: 'task', task, resumed: false }
  }

  task(taskId: string): Task {
    const t = this.state.tasks.find((x) => x.id === taskId)
    if (!t) throw new Error('unknown task')
    return t
  }

  /** The presentation currently filling a slot (flagged and invalidated ones are history). */
  private active(task: Task, position: number): Presentation | null {
    return this.state.presentations.find((p) => p.task_id === task.id && p.position === position
      && p.status !== 'flagged_replaced' && p.status !== 'invalidated') ?? null
  }

  /** A slot whose earlier presentation was flagged or invalidated needs a replacement (or is exhausted). */
  private replacedAt(task: Task, position: number): boolean {
    return this.state.presentations.some((p) => p.task_id === task.id && p.position === position
      && (p.status === 'flagged_replaced' || p.status === 'invalidated'))
  }

  private firstOf(p: Presentation) { return this.state.events.find((e) => e.presentation_id === p.id && e.phase === 'first') ?? null }
  private eventsOf(p: Presentation) { return this.state.events.filter((e) => e.presentation_id === p.id) }

  private isDone(p: Presentation): boolean {
    const first = this.firstOf(p)
    if (!first) return false
    return first.correct || p.status === 'corrected'
  }

  private awaiting(p: Presentation): 'first' | 'retry' | 'correction' | null {
    const ev = this.eventsOf(p)
    if (!ev.some((e) => e.phase === 'first')) return 'first'
    if (this.isDone(p)) return null
    return ev.some((e) => e.phase === 'retry') ? 'correction' : 'retry'
  }

  /** Targets assessed through a material in this task (they use whole-task aggregation). */
  private wholeTaskTargets(task: Task): Set<string> {
    return new Set(task.plan.slots.filter((s) => s.kind === 'material_question' && s.target_ref).map((s) => s.target_ref as string))
  }

  private present(task: Task, s: PlanSlot, item: CatalogueItem, role: Role, targetRef: string | null): Presentation {
    const now = this.deps.now()
    const date = this.today()
    const d = this.derived()
    // Re-check compatibility when shown: an incompatible question is general practice for this target.
    const candidate = targetRef ? d.progress.get(targetRef) : undefined
    const pr = candidate && compatibleItem(candidate.target, candidate.stage, item) ? candidate : undefined
    const exposure = this.state.exposure.find((e) => e.item_id === item.id)
    const release = this.release(task)
    // Novel context: neither this item nor another item of the same context was answered before for this
    // target. A presentation that was flagged before any answer does not make the context familiar.
    const answered = this.state.presentations.filter((p) => this.firstOf(p) !== null)
    const answeredItem = answered.some((p) => p.item_id === item.id)
    const seenContexts = new Set(answered.filter((p) => p.target_ref === targetRef && targetRef !== null)
      .map((p) => release.items.find((i) => i.id === p.item_id)?.context_ref))
    const p: Presentation = {
      id: this.newId(), task_id: task.id, position: s.position, item_id: item.id, item_version: item.version, role,
      material_ref: s.kind === 'material_question' ? s.material_ref : null,
      target_ref: pr ? pr.target.id : null, stage: pr ? pr.stage : null, format_class: item.format_class,
      first_response_eligible: s.counts_toward_x, prior_exposures: exposure?.times ?? 0,
      novel_context: !seenContexts.has(item.context_ref) && !answeredItem,
      presented_at: now, status: 'presented',
    }
    this.state.presentations.push(p)
    if (exposure) { exposure.last_presented_on = date; exposure.times += 1 }
    else this.state.exposure.push({ item_id: item.id, first_presented_on: date, last_presented_on: date, times: 1 })
    this.changed()
    return p
  }

  /** Ensure a slot has a presentation, creating it or a replacement. Null when the slot cannot be filled. */
  private ensure(task: Task, s: PlanSlot): Presentation | null {
    const existing = this.active(task, s.position)
    if (existing) {
      // Suspensions can arrive after the plan was frozen or the question was shown (a flag elsewhere, or a
      // parent decision). An unanswered presentation of a now-suspended version is withdrawn and replaced;
      // an answered one stays as done work (its evidence is excluded by the reducer).
      const stillUsable = usableVersion(this.state, existing.item_id, existing.item_version)
      if (stillUsable || this.firstOf(existing) !== null) return existing
      existing.status = 'invalidated'
      this.changed()
    }
    const release = this.release(task)
    let replacing = this.replacedAt(task, s.position)
    if (s.kind === 'material_question' && !replacing && s.item_id) {
      const item = itemIn(release, s.item_id)
      if (usableItem(this.state, item)) return this.present(task, s, item, 'material_question', s.target_ref)
      replacing = true
    }
    const ctx = this.ctx(task.subject, release, task.x)
    const resolved = resolveShortSlot(ctx, task, s, this.wholeTaskTargets(task))
    if (!resolved) return null
    // A replacement inside a material keeps the material boundary: feedback stays withheld until every
    // first response in that material is in, and its target keeps whole-task aggregation.
    return this.present(task, s, resolved.item, replacing ? 'replacement' : resolved.role, resolved.target?.target.id ?? null)
  }

  /** Formal first responses that count toward X (excludes flagged, invalidated, teaching and corrections). */
  answeredCount(task: Task): number {
    return this.state.presentations.filter((p) => p.task_id === task.id && p.first_response_eligible
      && p.status !== 'flagged_replaced' && p.status !== 'invalidated' && this.firstOf(p) !== null).length
  }

  /** What the child should see next. Advances past finished slots and finalises the task when done. */
  async next(taskId: string): Promise<Step> {
    const task = this.task(taskId)
    if (task.status === 'finalised') {
      const completion = this.state.completions.find((c) => c.task_id === task.id) as Completion
      return { kind: 'done', taskId, completion }
    }
    this.touch(taskId)
    const slots = task.plan.slots
    for (;;) {
      if (task.cursor >= slots.length) return this.finalise(task)
      const s = slots[task.cursor]
      if (s.kind === 'teaching') {
        return { kind: 'teaching', taskId, position: s.position, knowledgePointRef: this.kpOf(task, s), teachingRef: this.teachingOf(task, s) }
      }
      if (s.kind === 'material_question') {
        const group: PlanSlot[] = []
        for (let i = task.cursor; i < slots.length && slots[i].kind === 'material_question' && slots[i].material_ref === s.material_ref; i++) group.push(slots[i])
        // All first responses in a material precede any feedback or correction.
        for (const g of group) {
          const p = this.ensure(task, g)
          if (p && this.awaiting(p) === 'first') { await this.flush(); return this.question(task, p, true) }
        }
        for (const g of group) {
          const p = this.active(task, g.position)
          const a = p ? this.awaiting(p) : null
          if (p && a) return this.question(task, p, false)
        }
        task.cursor += group.length
        this.boundary(task)
        continue
      }
      const p = this.ensure(task, s)
      if (!p) { task.cursor += 1; continue }
      const a = this.awaiting(p)
      if (a) { await this.flush(); return this.question(task, p, false) }
      task.cursor += 1
      this.boundary(task)
    }
  }

  private kpOf(task: Task, s: PlanSlot): string {
    const t = this.state.targets.find((x) => x.id === s.target_ref)
    return t?.knowledge_point_ref ?? this.release(task).knowledge_points[0].ref
  }

  private teachingOf(task: Task, s: PlanSlot): string | null {
    const kp = this.kpOf(task, s)
    return this.release(task).knowledge_points.find((k) => k.ref === kp)?.teaching_ref ?? null
  }

  private question(task: Task, p: Presentation, withheld: boolean): Step {
    const awaiting = this.awaiting(p) ?? 'first'
    const help = awaiting === 'first' ? 'none' : awaiting === 'retry' ? HELP[task.subject].retry : HELP[task.subject].correction
    const item = this.release(task).items.find((i) => i.id === p.item_id && i.version === p.item_version) as CatalogueItem
    return { kind: 'question', taskId: task.id, presentation: p, item, awaiting, help, feedbackWithheld: withheld && awaiting === 'first' }
  }

  async completeTeaching(taskId: string): Promise<SaveStatus | null> {
    const task = this.task(taskId)
    const s = task.plan.slots[task.cursor]
    if (!s || s.kind !== 'teaching') throw new Error('no teaching step is current')
    this.touch(taskId)
    task.cursor += 1
    return this.flush()
  }

  private record(p: Presentation, phase: 'first' | 'retry' | 'correction', assistance: Assistance, response: Response, correct: boolean) {
    const e = {
      id: this.newId(), presentation_id: p.id, local_seq: this.state.next_seq++, phase, assistance,
      response: structuredClone(response), correct, at: this.deps.now(),
    }
    this.state.events.push(e)
    this.pendingEvents.push(e)
    this.changed()
  }

  private presentation(id: string): { p: Presentation; task: Task; item: CatalogueItem } {
    const p = this.state.presentations.find((x) => x.id === id)
    if (!p) throw new Error('unknown presentation')
    const task = this.task(p.task_id)
    if (task.status === 'finalised') throw new Error('task already finalised')
    if (p.status === 'flagged_replaced' || p.status === 'invalidated') throw new Error('presentation was replaced')
    const item = this.release(task).items.find((i) => i.id === p.item_id && i.version === p.item_version) as CatalogueItem
    return { p, task, item }
  }

  /**
   * Record a first response. It is committed (or held in memory with a warning) before any feedback is returned.
   * A repeat call for an answered presentation is rejected: reload never manufactures a new first attempt.
   */
  async answer(presentationId: string, response: Response): Promise<AnswerResult> {
    const { p, task, item } = this.presentation(presentationId)
    if (this.firstOf(p)) throw new Error('first response already recorded')
    this.touch(task.id)
    const correct = judge(item, response)
    this.record(p, 'first', 'none', response, correct)
    p.status = 'answered'
    if (!correct && p.target_ref === null && p.first_response_eligible) this.bankGeneralError(task, p, item, response)
    const saved = await this.flush()
    if (p.material_ref !== null) return { correct: null, next: 'continue', saved }
    return { correct, next: correct ? 'continue' : 'retry', saved }
  }

  /** One retry after the subject's hint. Never independent evidence and never counted toward X. */
  async retry(presentationId: string, response: Response): Promise<AnswerResult> {
    const { p, task, item } = this.presentation(presentationId)
    if (this.awaiting(p) !== 'retry') throw new Error('no retry is due')
    if (p.material_ref !== null && this.materialHasUnansweredFirst(task, p.material_ref)) throw new Error('material feedback is withheld')
    this.touch(task.id)
    const correct = judge(item, response)
    this.record(p, 'retry', HELP[task.subject].retry, response, correct)
    if (correct) p.status = 'corrected'
    const saved = await this.flush()
    return { correct, next: correct ? 'continue' : 'correction', saved }
  }

  /** Supported correction after the explanation (Mathematics: one supported key-step selection). */
  async correct(presentationId: string, response: Response): Promise<AnswerResult> {
    const { p, task, item } = this.presentation(presentationId)
    if (this.awaiting(p) !== 'correction') throw new Error('no correction is due')
    this.touch(task.id)
    this.record(p, 'correction', HELP[task.subject].correction, response, judge(item, response))
    p.status = 'corrected'
    const saved = await this.flush()
    return { correct: judge(item, response), next: 'continue', saved }
  }

  /**
   * True while any still-answerable question in the material lacks its first response. Each slot is
   * ensured first (shown, replaced, or found impossible to fill), so a withdrawn slot with no remaining
   * replacement never holds back help for the surviving answers.
   */
  private materialHasUnansweredFirst(task: Task, materialRef: string): boolean {
    return task.plan.slots.some((s) => {
      if (s.material_ref !== materialRef || s.kind !== 'material_question') return false
      const p = this.ensure(task, s)
      return p !== null && this.firstOf(p) === null
    })
  }

  /** A formal slot that was withdrawn (flagged, invalidated or suspended after planning) and has no replacement. */
  private exhausted(task: Task, s: PlanSlot): boolean {
    if (!s.counts_toward_x || this.active(task, s.position) !== null) return false
    if (this.replacedAt(task, s.position)) return true
    return s.kind === 'material_question' && s.item_id !== null && s.item_version !== null
      && !usableVersion(this.state, s.item_id, s.item_version)
  }

  /** General-practice first wrong responses enter the private bank automatically (internal source app_practice). */
  private bankGeneralError(task: Task, p: Presentation, item: CatalogueItem, response: Response) {
    if (item.course === 'p3_mathematics') return
    const date = this.today()
    const chosen = response.option_ids.find((o) => !item.key.option_ids.includes(o))
    const errorType = (chosen && item.error_types?.[chosen]) || 'unknown_cause'
    const existing = this.state.targets.find((t) => t.status === 'active' && t.subject === item.subject && t.course === item.course
      && t.knowledge_point_ref === item.knowledge_point_ref && t.assessed_skill === item.assessed_skill && t.error_type === errorType)
    // Provenance: instance_ref is the task, batch_ref the presentation that produced the observation, so the
    // reducer can drop it when that question is flagged or suspended and restore it on a parent decision.
    // Every app error is recorded; same-day repeats are labelled duplicates and collapse to one observation
    // in the reducer, so flagging one answer never silently loses another legitimate one.
    const sameDay = existing?.observations.some((o) => o.source_type === 'app_practice' && o.observed_on === date && !o.invalidated) ?? false
    const obs = {
      id: this.newId(), source_type: 'app_practice' as const, observed_on: date, recorded_on: date, instance_ref: task.id,
      batch_ref: p.id, recurrence: (existing ? (sameDay ? 'duplicate' : 'independent') : 'first') as 'first' | 'independent' | 'duplicate', invalidated: false,
    }
    if (existing) {
      existing.observations.push(obs)
    } else {
      const kp = this.release(task).knowledge_points.find((k) => k.ref === item.knowledge_point_ref)
      const target: Target = {
        id: this.newId(), subject: item.subject, course: item.course, target_kind: kp?.target_kind ?? 'language_point',
        knowledge_point_ref: item.knowledge_point_ref, target_value: null, assessed_skill: item.assessed_skill, error_type: errorType,
        mapping_status: 'mapped', verification: 'verified', status: 'active', verified_at: null, replaces: null, observations: [obs],
      }
      this.state.targets.push(target)
    }
    this.changed()
  }

  // ---------------------------------------------------------------- flags

  /** Child flags a suspected problem question: its evidence and count are removed and it is replaced. */
  async flag(presentationId: string, reason: Flag['reason']): Promise<SaveStatus | null> {
    const p = this.state.presentations.find((x) => x.id === presentationId)
    if (!p) throw new Error('unknown presentation')
    if (p.status === 'flagged_replaced') return null
    const now = this.deps.now()
    p.status = 'flagged_replaced'
    this.state.flags.push({ presentation_id: p.id, item_id: p.item_id, item_version: p.item_version, reason, flagged_at: now, status: 'open', decided_at: null })
    const active = this.state.suspensions.find((s) => s.item_id === p.item_id && s.item_version === p.item_version && s.restored_at === null)
    if (!active) this.state.suspensions.push({ item_id: p.item_id, item_version: p.item_version, scope: 'version', since: now, restored_at: null })
    this.changed()
    return this.flush()
  }

  /** Parent decision on a flagged item version: restore it, or disable it for this child. Traceable as an amendment. */
  async decideFlag(itemId: string, itemVersion: number, decision: 'restored' | 'disabled'): Promise<SaveStatus | null> {
    const now = this.deps.now()
    const open = this.state.flags.filter((f) => f.item_id === itemId && f.item_version === itemVersion && f.status === 'open')
    if (open.length === 0) return null
    for (const f of open) { f.status = decision; f.decided_at = now }
    for (const s of this.state.suspensions) {
      if (s.item_id === itemId && s.item_version === itemVersion && s.restored_at === null && decision === 'restored') s.restored_at = now
    }
    this.state.amendments.push({
      id: this.newId(), at: now, actor: 'parent', kind: decision === 'restored' ? 'restore_item' : 'disable_item',
      refs: [itemId], replacement_ref: null, reason: 'question_problem', reducer_revision: 1,
    })
    this.changed()
    return this.flush()
  }

  // ---------------------------------------------------------------- story checkpoints

  private dailyCreditTakenElsewhere(task: Task, date: string): boolean {
    return this.state.completions.some((c) => c.subject === task.subject && c.local_date === date && c.task_id !== task.id)
  }

  private halfwayThreshold(task: Task): number {
    return isLanguage(task.subject) ? halfwayOf(task.planned_total) : halfwayOf(task.x)
  }

  private emit(task: Task, kind: Checkpoint['kind']) {
    const story = this.state.story
    const id = `${task.id}:${kind}`
    if (story.checkpoints.some((c) => c.id === id)) return
    story.checkpoints.push({ id, task_id: task.id, kind, local_date: this.today(), story_seq: story.next_story_seq++, state: 'pending', delivered_at: null })
  }

  private hasCheckpoint(task: Task, kinds: Checkpoint['kind'][]): boolean {
    return this.state.story.checkpoints.some((c) => c.task_id === task.id && kinds.includes(c.kind))
  }

  /** Safe boundary after a material (with its corrections) or a short question: emit halfway once. */
  private boundary(task: Task) {
    if (task.cursor >= task.plan.slots.length) return // the finalisation decides between completion and combined
    if (this.dailyCreditTakenElsewhere(task, this.today())) return
    if (this.answeredCount(task) >= this.halfwayThreshold(task) && !this.hasCheckpoint(task, ['halfway', 'combined'])) this.emit(task, 'halfway')
  }

  async deliverCheckpoint(id: string): Promise<SaveStatus | null> {
    const c = this.state.story.checkpoints.find((x) => x.id === id)
    if (!c || c.state === 'delivered') return null
    c.state = 'delivered'
    c.delivered_at = this.deps.now()
    return this.flush()
  }

  pendingCheckpoints(): Checkpoint[] {
    return this.state.story.checkpoints.filter((c) => c.state === 'pending').sort((a, b) => a.story_seq - b.story_seq)
  }

  // ---------------------------------------------------------------- finalisation

  private async finalise(task: Task): Promise<Step> {
    const now = this.deps.now()
    const date = this.today()
    const answered = this.answeredCount(task)
    const formalPlanned = task.plan.slots.filter((s) => s.counts_toward_x).length
    const exhausted = task.plan.slots.some((s) => this.exhausted(task, s))
    const reason: Completion['reason'] = exhausted ? 'replacements_exhausted' : answered < formalPlanned ? 'shortened_no_eligible_content' : 'full'
    const credit = !this.dailyCreditTakenElsewhere(task, date)
    if (credit && answered > 0) {
      if (this.hasCheckpoint(task, ['halfway', 'combined'])) this.emit(task, 'completion')
      else if (reason === 'full' && answered >= this.halfwayThreshold(task)) this.emit(task, 'combined')
      else this.emit(task, 'completion')
    }
    this.account(task, Date.parse(now))
    task.activity.push({ state: 'closed', at: now })
    task.status = 'finalised'
    task.finalised_at = now
    const completion: Completion = { subject: task.subject, local_date: date, task_id: task.id, reason, answered }
    this.state.completions.push(completion)
    this.state.calendar_guards.last_finalised_date = date
    this.changed()
    await this.flush()
    return { kind: 'done', taskId: task.id, completion }
  }

  // ---------------------------------------------------------------- active time

  private account(task: Task, t: number) {
    const last = this.lastTouch.get(task.id)
    const lastState = task.activity[task.activity.length - 1]?.state
    if (last !== undefined && lastState === 'active') {
      const gap = (t - last) / 1000
      if (gap > 0 && gap < IDLE_AFTER_SECONDS) task.active_seconds = Math.min(86_400, task.active_seconds + Math.round(gap))
    }
    this.lastTouch.set(task.id, t)
  }

  /** Any interaction: counts time since the last one unless two or more minutes passed (then idle). */
  touch(taskId: string) {
    const task = this.task(taskId)
    if (task.status === 'finalised') return
    const now = this.deps.now()
    const t = Date.parse(now)
    const last = this.lastTouch.get(task.id)
    const lastState = task.activity[task.activity.length - 1]?.state
    if (lastState === 'active' && last !== undefined && (t - last) / 1000 >= IDLE_AFTER_SECONDS) {
      task.activity.push({ state: 'idle', at: new Date(last).toISOString() })
      task.activity.push({ state: 'active', at: now })
      this.lastTouch.set(task.id, t)
      return
    }
    if (lastState !== 'active') {
      task.activity.push({ state: 'active', at: now })
      this.lastTouch.set(task.id, t)
      if (task.status === 'paused') task.status = 'active'
      return
    }
    this.account(task, t)
  }

  private async setActivity(taskId: string, state: ActivityState): Promise<SaveStatus | null> {
    const task = this.task(taskId)
    if (task.status === 'finalised') return null
    this.account(task, Date.parse(this.deps.now()))
    task.activity.push({ state, at: this.deps.now() })
    if (state === 'paused') task.status = 'paused'
    this.lastTouch.delete(task.id)
    return this.flush()
  }

  pause(taskId: string) { return this.setActivity(taskId, 'paused') }
  background(taskId: string) { return this.setActivity(taskId, 'backgrounded') }

  async resume(taskId: string): Promise<SaveStatus | null> {
    const task = this.task(taskId)
    if (task.status === 'finalised') return null
    task.status = 'active'
    task.activity.push({ state: 'active', at: this.deps.now() })
    this.lastTouch.set(task.id, Date.parse(this.deps.now()))
    return this.flush()
  }

  // ---------------------------------------------------------------- persistence

  /** Write changed records and new events as one ordered mutation. */
  async flush(): Promise<SaveStatus | null> {
    const puts: Put[] = []
    for (const p of toRecords(this.state)) {
      const k = `${p.table}\u0000${p.key}`
      const json = JSON.stringify(p.value)
      if (this.persisted.get(k) !== json) {
        puts.push({ table: p.table as Table, key: p.key, value: structuredClone(p.value) })
        this.persisted.set(k, json)
      }
    }
    const events = this.pendingEvents
    this.pendingEvents = []
    if (puts.length === 0 && events.length === 0) return this.deps.writer?.status() ?? null
    const m: Mutation = { id: this.newId(), order: this.order++, puts, events }
    if (!this.deps.writer) return null
    return this.deps.writer.enqueue(m)
  }
}
