// Coordinates the parent's private mistake programme on one device: installs reviewed public Chinese content
// and, when present, the private corrective pack; imports the accepted register into the engine; records
// parent-observed production evidence; and builds the per-case report and private export.
//
// Private records (packs, crosswalk, production events) live in a separate device-local store keyed by the
// signed-in identity. They are not engine records, never enter the pilot snapshot and never leave the device
// except in the export file the parent saves on purpose.
import type { CatalogueRegistry, CatalogueRelease } from '../catalogue/adapter.ts'
import { buildChineseContent, type BuiltContent, type RawBatch, type TargetLists } from '../catalogue/chinese.ts'
import type { LearningEngine } from '../engine/engine.ts'
import type { EngineState, Target } from '../engine/types.ts'
import { amendmentView, currentTarget, leaderOf, mistakeGroups } from '../engine/amendments.ts'
import { registerExercise, registerMaterial, registerReviewState, registerTargetLabels } from '../ui/content.ts'
import { isImportedCase, planIntake, type CrosswalkRow, type IntakeResult } from './intake.ts'
import { packTag, productionPlans, validatePack, type PrivatePack, type Register } from './pack.ts'
import { deriveProduction, type ProductionEvent, type ProductionStage } from './production.ts'
import { buildExport, buildReport, normalizedEvents, type CaseReport, type PrivateExport } from './report.ts'
import { syncablePack } from '../sync/pack.ts'
import { learningDate } from '../engine/calendar.ts'

export interface PrivateStore {
  /** At most one pack: the current one. */
  packs(): Promise<PrivatePack[]>
  /** Replaces the stored pack. Earlier content stays available to pinned tasks through stored builds. */
  putPack(pack: PrivatePack): Promise<void>
  crosswalk(): Promise<CrosswalkRow[]>
  putCrosswalk(rows: CrosswalkRow[]): Promise<void>
  production(): Promise<ProductionEvent[]>
  addProduction(e: ProductionEvent): Promise<void>
  /** Content builds kept so a task pinned to an earlier version still resumes after an update (F29). */
  releases(): Promise<StoredBuild[]>
  putRelease(b: StoredBuild): Promise<void>
  deleteRelease(version: string): Promise<void>
  /** Retained pack versions (downloaded by sync), so a task pinned to an earlier version can be rebuilt. */
  packVersions(): Promise<PrivatePack[]>
}

/** A serialisable content build. */
export interface StoredBuild {
  version: string
  release: CatalogueRelease
  exercises: [string, BuiltContent['exercises'] extends Map<string, infer V> ? V : never][]
  materials: [string, BuiltContent['materials'] extends Map<string, infer V> ? V : never][]
  itemBatch: [string, BuiltContent['itemBatch'] extends Map<string, infer V> ? V : never][]
}

const toStored = (b: BuiltContent): StoredBuild => ({
  version: b.release.version, release: b.release, exercises: [...b.exercises], materials: [...b.materials], itemBatch: [...b.itemBatch],
})

export class MemoryPrivateStore implements PrivateStore {
  packList: PrivatePack[] = []
  rows: CrosswalkRow[] = []
  events = new Map<string, ProductionEvent>()
  // Like the device store: listed by pack_id, and the current pack replaces any earlier one.
  async packs() { return structuredClone([...this.packList].sort((a, b) => a.pack_id.localeCompare(b.pack_id))) }
  async putPack(p: PrivatePack) { this.packList = [structuredClone(p)] }
  async crosswalk() { return structuredClone(this.rows) }
  async putCrosswalk(rows: CrosswalkRow[]) { this.rows = structuredClone(rows) }
  async production() { return [...this.events.values()].map((e) => structuredClone(e)) }
  async addProduction(e: ProductionEvent) { if (!this.events.has(e.id)) this.events.set(e.id, structuredClone(e)) }
  builds = new Map<string, StoredBuild>()
  async releases() { return [...this.builds.values()].map((b) => structuredClone(b)) }
  async putRelease(b: StoredBuild) { this.builds.set(b.version, structuredClone(b)) }
  async deleteRelease(v: string) { this.builds.delete(v) }
  async packVersions(): Promise<PrivatePack[]> { return [] }
}

export interface PublicChinese { lists: TargetLists; batches: RawBatch[] }

export const LEARNER_COURSES: Record<string, string[]> = {
  p2_higher_chinese: ['p2_higher_chinese', 'p3_higher_chinese'],
  p2_chinese: ['p2_chinese', 'p3_chinese'],
}

/**
 * Engine targets a set-aside pack's cases live on: those in its saved case links, plus every target holding
 * imported case evidence. The second part matters because engine targets are saved before the case links, so an
 * interrupted import can leave targets the saved links do not list. Only one pack is stored at a time, so this can
 * also hold a target that only an earlier pack imported; that errs towards pausing, never towards practising a
 * target without its case pins.
 */
const heldFrom = (rows: CrosswalkRow[], targets: readonly Target[]) => new Set([
  ...rows.flatMap((r) => (r.engine_target_id ? [r.engine_target_id] : [])),
  ...targets.filter((t) => t.observations.some(isImportedCase)).map((t) => t.id),
])

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * A pack that does not fit this app (structure, content or routes). Distinct from storage failures, which are
 * not the file's fault and must not be presented to the parent as a rejected file.
 */
export class PackRejected extends Error {
  constructor(cause: unknown) {
    super(errorText(cause))
    this.name = 'PackRejected'
  }
}

/**
 * The pack was saved and is the active pack, but finishing its import (engine targets, case links) could not be
 * saved yet. Those steps are idempotent: `retryImport()` or the next open completes them.
 */
export class PackImportIncomplete extends Error {
  constructor(cause: unknown) {
    super(errorText(cause))
    this.name = 'PackImportIncomplete'
  }
}

export class MistakeProgram {
  readonly engine: LearningEngine
  private readonly registry: CatalogueRegistry
  private readonly publicContent: PublicChinese
  private readonly store: PrivateStore
  private readonly now: () => string
  private readonly newId: () => string
  /** Content builds by release version, so a task pinned to an earlier pack keeps its presentations. */
  private readonly built = new Map<string, BuiltContent>()
  private pack: PrivatePack | null = null
  /** Why the stored pack could not be used when the app opened; practice continues without it. */
  openError: string | null = null
  /** Set when the active pack is saved but its import records are not all saved yet (see PackImportIncomplete). */
  importPending: string | null = null
  private rows: CrosswalkRow[] = []
  private events: ProductionEvent[] = []

  private constructor(opts: { engine: LearningEngine; registry: CatalogueRegistry; publicContent: PublicChinese; store: PrivateStore; now: () => string; newId?: () => string }) {
    this.engine = opts.engine
    this.registry = opts.registry
    this.publicContent = opts.publicContent
    this.store = opts.store
    this.now = opts.now
    this.newId = opts.newId ?? (() => crypto.randomUUID())
  }

  /** Install public content (and every stored pack, oldest first, so pinned tasks keep working). */
  static async open(opts: { engine: LearningEngine; registry: CatalogueRegistry; publicContent: PublicChinese; store: PrivateStore; now: () => string; newId?: () => string; course?: string }): Promise<MistakeProgram> {
    const p = new MistakeProgram(opts)
    p.course = opts.course ?? 'p2_higher_chinese'
    await p.load()
    return p
  }

  private course = 'p2_higher_chinese'

  /**
   * (Re)load from the private store: current pack, kept builds for pinned tasks, case links and production events.
   * Also used after sync downloads pack records, so a restored device installs the downloaded pack.
   */
  async reload(): Promise<void> {
    await this.load()
  }

  private async load(): Promise<void> {
    const p = this
    const opts = { engine: this.engine, store: this.store, now: this.now }
    p.openError = null
    p.pack = null
    // Earlier content versions that an unfinished task still pins are reinstalled first; others are pruned.
    const pinned = new Set(opts.engine.state.tasks.filter((t) => t.subject === 'chinese').map((t) => t.content_version))
    const stored = await opts.store.releases()
    const current = new Set<string>()
    const builds = [p.buildFor(this.course, null)]
    // A stored pack that no longer fits this app version (stricter checks, changed content) must never stop the
    // child from practising: it is set aside and reported in the parent area until an updated pack is loaded.
    for (const rawPack of await opts.store.packs()) {
      try {
        const pack = validatePack(rawPack)
        const build = p.buildFor(pack.course, pack)
        // Quarantine structural/content mismatches before activating or persisting the candidate release.
        planIntake({ state: opts.engine.state, register: pack.register, release: build.release,
          targets: build.targets, today: opts.engine.today(), now: opts.now() })
        builds.push(build)
        p.pack = pack
      } catch (error) { p.openError = errorText(error) }
    }
    for (const b of builds) current.add(b.release.version)
    const installed = new Set<string>()
    for (const sb of stored) {
      if (current.has(sb.version)) continue
      if (pinned.has(sb.version)) { p.installStored(sb); installed.add(sb.version) }
      else await opts.store.deleteRelease(sb.version)
    }
    // A restored device has no kept builds: rebuild a pinned task's content from the retained pack versions.
    for (const raw of await opts.store.packVersions()) {
      try {
        const version = validatePack(raw)
        const build = p.buildFor(version.course, version)
        const v = build.release.version
        if (!pinned.has(v) || current.has(v) || installed.has(v)) continue
        p.install(build)
        installed.add(v)
        await opts.store.putRelease(toStored(build))
      } catch { /* a version this app cannot build stays unused; tasks pinned to it report missing content */ }
    }
    for (const b of builds) { p.install(b); await opts.store.putRelease(toStored(b)) }
    p.rows = await opts.store.crosswalk()
    p.events = await opts.store.production()
    // While the stored pack is set aside, the targets it imported are held: they keep their records but get no
    // slots, so they are neither practised without their case pins nor given slots with nothing to show.
    if (!p.pack && p.openError !== null) opts.engine.holdTargets(heldFrom(p.rows, opts.engine.state.targets))
    else opts.engine.holdTargets([])
    // Validation failures were handled before activation. Storage failures must propagate: swallowing one
    // here could claim recovery after engine records have already changed.
    if (p.pack) await p.importRegister()
  }

  private buildFor(course: string, pack: PrivatePack | null): BuiltContent {
    const courses = LEARNER_COURSES[course] ?? [course]
    const stagePins = new Map<string, Map<string, Set<string>>>()
    for (const c of pack?.register.cases ?? []) {
      if (c.route.mode !== 'objective') continue
      const ref = c.route.progress_target_ref
      const stages = stagePins.get(ref) ?? new Map<string, Set<string>>()
      for (const [stage, pins] of Object.entries(c.route.stages)) {
        const ids = stages.get(stage) ?? new Set<string>()
        for (const pin of pins) ids.add(`${pin.item_id}@${pin.version}`)
        stages.set(stage, ids)
      }
      stagePins.set(ref, stages)
    }
    return buildChineseContent({
      courses, stagePins, lists: this.publicContent.lists, batches: this.publicContent.batches,
      privateBatches: pack?.corrective_batches ?? [], privateTargets: pack?.private_targets ?? [],
      privateTag: pack ? packTag(pack) : null,
    })
  }

  private installStored(sb: StoredBuild) {
    this.install({ release: sb.release, exercises: new Map(sb.exercises), materials: new Map(sb.materials), itemBatch: new Map(sb.itemBatch), targets: new Map() })
  }

  private install(b: BuiltContent) {
    const r = this.registry.install(b.release)
    if (!r.ok) throw new Error(`content_install_failed:${r.reason}`)
    this.built.set(b.release.version, b)
    for (const [id, e] of b.exercises) registerExercise(id, e, b.release.version)
    for (const [ref, m] of b.materials) registerMaterial(ref, m, b.release.version)
    registerReviewState(b.release.version, b.itemBatch)
    registerTargetLabels(b.targets)
  }

  get register(): Register | null { return this.pack?.register ?? null }
  get crosswalk(): CrosswalkRow[] { return this.rows }
  get productionEvents(): ProductionEvent[] { return this.events }
  currentRelease(): CatalogueRelease | null { return this.registry.current('chinese') }
  private currentBuild(): BuiltContent | null {
    const r = this.currentRelease()
    return r ? this.built.get(r.version) ?? null : null
  }

  /** Review state of the batch holding an item in the current content. */
  itemStatus(itemId: string): string | null {
    return this.currentBuild()?.itemBatch.get(itemId)?.status ?? null
  }

  /** Validate a candidate without changing active content, learning records or private storage. */
  async previewPack(raw: unknown): Promise<{ pack: PrivatePack; result: IntakeResult }> {
    const { pack, result } = await this.preparePack(raw)
    return { pack, result }
  }

  private async preparePack(raw: unknown) {
    try {
      const pack = validatePack(structuredClone(raw))
      const syncable = await syncablePack(pack)
      if (!syncable.ok) throw new Error(syncable.code)
      const build = this.buildFor(pack.course, pack)
      const result = planIntake({ state: this.engine.state, register: pack.register, release: build.release,
        targets: build.targets, today: learningDate(this.now(), this.engine.state.settings, this.engine.state.calendar_guards), now: this.now() })
      return { pack, build, result }
    } catch (error) { throw new PackRejected(error) }
  }

  /**
   * Install a private pack from a file the parent chose, then import its accepted register. Idempotent: the
   * same pack again changes nothing; a newer pack adds new cases and content without touching evidence.
   */
  async installPack(raw: unknown): Promise<IntakeResult> {
    // Revalidate on confirmation against current records; a preview never freezes stale intake decisions.
    const { pack, build: b } = await this.preparePack(raw)
    const previous = this.registry.current('chinese')
    this.install(b)
    try {
      await this.store.putRelease(toStored(b))
      await this.store.putPack(pack)
    } catch (error) {
      // Before the commit point nothing new may stay in use: restore the content that was current.
      // (Re-installing an identical release only makes it current again.)
      if (previous) this.registry.install(previous)
      throw error
    }
    // Commit point: the saved pack is now the active pack (it is also what the next open loads). The remaining
    // steps only add engine targets and case links; they are idempotent, so a failure is reported as an
    // incomplete import that retryImport() or the next open finishes, never as a rollback.
    this.pack = pack
    this.openError = null
    this.engine.holdTargets([])
    return this.completeImport()
  }

  /** Finish an import whose records could not all be saved (see PackImportIncomplete). Safe to repeat. */
  async retryImport(): Promise<IntakeResult> {
    if (!this.pack) throw new Error('no_private_pack')
    return this.completeImport()
  }

  private async completeImport(): Promise<IntakeResult> {
    try {
      const { result, saved } = await this.runImport()
      // The engine queues a failed write and reports it instead of throwing; the import is not complete
      // until its targets are durable.
      if (saved?.warning) throw new Error(`engine_records_not_saved:${saved.lastError ?? 'unknown'}`)
      this.importPending = null
      return result
    } catch (error) {
      this.importPending = errorText(error)
      throw new PackImportIncomplete(error)
    }
  }

  /** (Re)import the current register against the current content. Safe to repeat. */
  async importRegister(): Promise<IntakeResult> {
    return (await this.runImport()).result
  }

  private async runImport() {
    if (!this.pack) throw new Error('no_private_pack')
    const b = this.currentBuild()
    if (!b) throw new Error('no_content')
    const result = planIntake({
      state: this.engine.state, register: this.pack.register, release: b.release, targets: b.targets,
      today: this.engine.today(), now: this.now(),
    })
    // With nothing new to add, still push any engine writes queued by an earlier failure.
    const saved = result.records.length > 0 ? await this.engine.upsertTargets(result.records) : await this.engine.retrySaves()
    // A stored link that still names the same mistake (an earlier version a correction superseded, or another record
    // of the same mistake) is kept: links sync by latest edit, so rewriting an equivalent link from every device that
    // re-imports would make devices overwrite each other on every sync. Readers follow corrections and groups.
    const crosswalk = keepEquivalentLinks(this.engine.state, await this.store.crosswalk(), result.crosswalk)
    this.rows = crosswalk
    await this.store.putCrosswalk(crosswalk)
    return { result: { ...result, crosswalk }, saved }
  }

  plans() {
    return this.pack ? productionPlans(this.pack.register) : new Map()
  }

  productionProgress(planId: string) {
    return deriveProduction(planId, this.events)
  }

  /** Record one parent-observed production attempt at the plan's current stage. */
  async recordProduction(planId: string, mode: ProductionEvent['mode'], result: ProductionEvent['result']): Promise<ProductionEvent> {
    if (!this.plans().has(planId)) throw new Error('unknown_plan')
    const stage: ProductionStage = this.productionProgress(planId).stage
    const e: ProductionEvent = {
      id: this.newId(), plan_id: planId, stage, observed_on: this.engine.today(), mode,
      result: mode === 'supported' ? 'not_yet' : result, recorded_at: this.now(),
    }
    await this.store.addProduction(e)
    this.events = [...this.events, e]
    return e
  }

  report(): CaseReport | null {
    if (!this.pack) return null
    return buildReport({
      state: this.engine.state, derived: this.engine.derived(), register: this.pack.register, crosswalk: this.rows,
      release: this.currentRelease(), itemStatus: (id) => this.itemStatus(id), production: this.events,
      asOf: this.engine.today(), now: this.now(),
    })
  }

  exportFile(): PrivateExport | null {
    const report = this.report()
    if (!report) return null
    return buildExport(report, normalizedEvents(this.engine.state, this.engine.derived(), this.rows), this.events, this.now())
  }
}

/** Keep each stored case link whose target resolves to the same current mistake as the newly computed one. */
function keepEquivalentLinks(state: EngineState, stored: CrosswalkRow[], computed: CrosswalkRow[]): CrosswalkRow[] {
  const view = amendmentView(state)
  const groups = mistakeGroups(state, view)
  const resolve = (id: string | null) => {
    if (id === null) return null
    const t = currentTarget(state, id, view)
    return t ? leaderOf(groups, t.id) : `gone:${id}`
  }
  const before = new Map(stored.map((r) => [r.case_id, r]))
  return computed.map((row) => {
    const old = before.get(row.case_id)
    if (!old || old.engine_target_id === row.engine_target_id || old.engine_target_id === null || row.engine_target_id === null) return row
    return resolve(old.engine_target_id) === resolve(row.engine_target_id) ? { ...row, engine_target_id: old.engine_target_id } : row
  })
}
