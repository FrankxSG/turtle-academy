// Cache generic public content only. This store never receives packs, case crosswalks or learner records.
import type { CatalogueRegistry, CatalogueRelease } from './adapter.ts'
import { buildChineseContent, type RawBatch, type TargetLists } from './chinese.ts'
import { CHINESE_COURSES, RELEASED_CHINESE_COURSE } from '../chinese-course.ts'
import { registerExercise, registerMaterial, registerReviewState, registerTargetLabels, type Exercise, type MaterialText } from '../ui/content.ts'

export interface CachedPublicBuild {
  version: string
  release: CatalogueRelease
  exercises: [string, Exercise][]
  materials: [string, MaterialText][]
  /** Item → batch review state. Absent in builds cached before it was recorded: those are not labelled reviewed. */
  itemBatch?: [string, { batch_id: string; status: string; private: boolean }][]
}
export interface PublicBuildStore {
  all(): Promise<CachedPublicBuild[]>
  put(build: CachedPublicBuild): Promise<void>
}
export async function installPublicBuilds(registry: CatalogueRegistry, store: PublicBuildStore,
  pinned: Set<string>, content: { lists: TargetLists; batches: RawBatch[] },
  courses: readonly string[] = CHINESE_COURSES[RELEASED_CHINESE_COURSE].courses) {
  const built = buildChineseContent({ courses: [...courses], ...content })
  const cacheEntry = (b: ReturnType<typeof buildChineseContent>): CachedPublicBuild => ({
    version: b.release.version, release: b.release,
    exercises: [...b.exercises], materials: [...b.materials], itemBatch: [...b.itemBatch],
  })
  const current = cacheEntry(built)
  const install = (b: CachedPublicBuild) => {
    const result = registry.install(b.release)
    if (!result.ok) throw new Error(`content_install_failed:${result.reason}`)
    for (const [id, e] of b.exercises) registerExercise(id, e, b.release.version)
    for (const [id, m] of b.materials) registerMaterial(id, m, b.release.version)
    registerReviewState(b.release.version, b.itemBatch ?? [])
  }
  for (const previous of await store.all()) {
    if (previous.version === current.version) continue
    if (pinned.has(previous.version)) install(previous)
    // This generic cache is shared across identities; another identity may still pin an older build.
    // Retention is deferred until pins can be checked across all local working copies.
  }
  // A task can arrive from sync after startup, before its device has cached the other course's release.
  // Keep the bundled release available by version; only the selected course is current.
  for (const other of Object.values(CHINESE_COURSES)) {
    if (courses.includes(other.pack)) continue
    install(cacheEntry(buildChineseContent({ courses: [...other.courses], ...content })))
  }
  await store.put(current)
  install(current)
  registerTargetLabels(built.targets)
}
