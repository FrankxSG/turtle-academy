// Cache generic public content only. This store never receives packs, case crosswalks or learner records.
import type { CatalogueRegistry, CatalogueRelease } from './adapter.ts'
import { buildChineseContent, type RawBatch, type TargetLists } from './chinese.ts'
import { registerExercise, registerMaterial, type Exercise, type MaterialText } from '../ui/content.ts'

export interface CachedPublicBuild {
  version: string
  release: CatalogueRelease
  exercises: [string, Exercise][]
  materials: [string, MaterialText][]
}
export interface PublicBuildStore {
  all(): Promise<CachedPublicBuild[]>
  put(build: CachedPublicBuild): Promise<void>
}
export async function installPublicBuilds(registry: CatalogueRegistry, store: PublicBuildStore,
  pinned: Set<string>, content: { lists: TargetLists; batches: RawBatch[] }) {
  const built = buildChineseContent({ courses: ['p2_higher_chinese', 'p3_higher_chinese'], ...content })
  const current: CachedPublicBuild = { version: built.release.version, release: built.release,
    exercises: [...built.exercises], materials: [...built.materials] }
  const install = (b: CachedPublicBuild) => {
    const result = registry.install(b.release)
    if (!result.ok) throw new Error(`content_install_failed:${result.reason}`)
    for (const [id, e] of b.exercises) registerExercise(id, e, b.release.version)
    for (const [id, m] of b.materials) registerMaterial(id, m, b.release.version)
  }
  for (const previous of await store.all()) {
    if (previous.version === current.version) continue
    if (pinned.has(previous.version)) install(previous)
    // This generic cache is shared across identities; another identity may still pin an older build.
    // Retention is deferred until pins can be checked across all local working copies.
  }
  await store.put(current)
  install(current)
}
