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
import { registerExercise, registerMaterial } from '../ui/content.ts'
import { planIntake, type CrosswalkRow, type IntakeResult } from './intake.ts'
import { packTag, productionPlans, validatePack, type PrivatePack, type Register } from './pack.ts'
import { deriveProduction, type ProductionEvent, type ProductionStage } from './production.ts'
import { buildExport, buildReport, normalizedEvents, type CaseReport, type PrivateExport } from './report.ts'

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
}

export interface PublicChinese { lists: TargetLists; batches: RawBatch[] }

export const LEARNER_COURSES: Record<string, string[]> = {
  p2_higher_chinese: ['p2_higher_chinese', 'p3_higher_chinese'],
  p2_chinese: ['p2_chinese', 'p3_chinese'],
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error))

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
    // Earlier content versions that an unfinished task still pins are reinstalled first; others are pruned.
    const pinned = new Set(opts.engine.state.tasks.filter((t) => t.subject === 'chinese').map((t) => t.content_version))
    const stored = await opts.store.releases()
    const current = new Set<string>()
    const builds = [p.buildFor(opts.course ?? 'p2_higher_chinese', null)]
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
    for (const sb of stored) {
      if (current.has(sb.version)) continue
      if (pinned.has(sb.version)) p.installStored(sb)
      else await opts.store.deleteRelease(sb.version)
    }
    for (const b of builds) { p.install(b); await opts.store.putRelease(toStored(b)) }
    p.rows = await opts.store.crosswalk()
    p.events = await opts.store.production()
    // Validation failures were handled before activation. Storage failures must propagate: swallowing one
    // here could claim recovery after engine records have already changed.
    if (p.pack) await p.importRegister()
    return p
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

  /**
   * Install a private pack from a file the parent chose, then import its accepted register. Idempotent: the
   * same pack again changes nothing; a newer pack adds new cases and content without touching evidence.
   */
  async installPack(raw: unknown): Promise<IntakeResult> {
    const pack = validatePack(raw)
    const b = this.buildFor(pack.course, pack)
    // Resolve every route before mutating the registry or persisting any part of an intake.
    planIntake({ state: this.engine.state, register: pack.register, release: b.release, targets: b.targets,
      today: this.engine.today(), now: this.now() })
    this.install(b)
    await this.store.putRelease(toStored(b))
    await this.store.putPack(pack)
    this.pack = pack
    this.openError = null
    return this.importRegister()
  }

  /** (Re)import the current register against the current content. Safe to repeat. */
  async importRegister(): Promise<IntakeResult> {
    if (!this.pack) throw new Error('no_private_pack')
    const b = this.currentBuild()
    if (!b) throw new Error('no_content')
    const result = planIntake({
      state: this.engine.state, register: this.pack.register, release: b.release, targets: b.targets,
      today: this.engine.today(), now: this.now(),
    })
    if (result.records.length > 0) await this.engine.upsertTargets(result.records)
    this.rows = result.crosswalk
    await this.store.putCrosswalk(result.crosswalk)
    return result
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
