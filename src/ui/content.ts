// Presentation text for catalogue items: stems, options, hints, explanations and material bodies.
// The engine judges against keys in the catalogue release; this registry only supplies what the child reads.
// Development fixtures and reviewed subject content (public batches and a device-local private pack) all
// register here, keyed by item id or material ref.
import type { CatalogueRelease } from '../catalogue/adapter.ts'
import type { Response } from '../engine/types.ts'

export interface Exercise {
  stem: string
  options: { id: string; text: string }[]
  left?: { id: string; text: string }[]
  hint: string
  explanation: string
  key: Response
}

export interface MaterialText {
  title: string
  text: string
}

const exercises = new Map<string, Exercise>()
const materials = new Map<string, MaterialText>()
const versionedExercises = new Map<string, Exercise>()
const versionedMaterials = new Map<string, MaterialText>()

export function registerExercise(id: string, e: Exercise, version?: string) {
  exercises.set(id, e)
  if (version) versionedExercises.set(`${version}/${id}`, e)
}

export function registerMaterial(ref: string, m: MaterialText, version?: string) {
  materials.set(ref, m)
  if (version) versionedMaterials.set(`${version}/${ref}`, m)
}

export function exercise(id: string, version?: string): Exercise {
  const e = version ? versionedExercises.get(`${version}/${id}`) ?? (version === 'dev-ui-1' ? exercises.get(id) : undefined) : exercises.get(id)
  if (!e) throw new Error('presentation_missing')
  return e
}

export function hasExercise(id: string): boolean {
  return exercises.has(id)
}

export function material(ref: string, version?: string): MaterialText {
  const m = version ? versionedMaterials.get(`${version}/${ref}`) ?? (version === 'dev-ui-1' ? materials.get(ref) : undefined) : materials.get(ref)
  if (!m) throw new Error('material_missing')
  return m
}

// Review state, recorded per content version as releases are installed: an item counts as reviewed only when the
// batch that holds it is approved. Nothing unrecorded (an older cached build, a private batch pending review) is
// ever presented as reviewed.
const reviewed = new Map<string, Set<string>>()

/** Record a build's reviewed items (batch `approved` only) from its item → batch review state map, replacing any
 * earlier record for that version. */
export function registerReviewState(version: string, itemBatch: Iterable<[string, { status: string }]>) {
  const ids = new Set<string>()
  for (const [id, b] of itemBatch) if (b.status === 'approved') ids.add(id)
  reviewed.set(version, ids)
}

export type ContentKind = 'synthetic' | 'reviewed' | 'unreviewed'

/**
 * What the child is shown: synthetic development fixtures, reviewed content, or content not (or not known to be)
 * reviewed. For one item pass its id; for a whole release (a subject card), every item must be reviewed.
 */
export function contentKind(release: CatalogueRelease, itemId?: string): ContentKind {
  if (release.development_only) return 'synthetic'
  const ids = itemId !== undefined ? [itemId] : release.items.map((i) => i.id)
  const known = reviewed.get(release.version)
  return known !== undefined && ids.length > 0 && ids.every((id) => known.has(id)) ? 'reviewed' : 'unreviewed'
}

/** Child-facing labels. A subject card describes its whole release; a question describes itself. */
export const contentLabels: Record<ContentKind, { en: string; zh: string }> = {
  synthetic: { en: 'Synthetic development content', zh: '开发用模拟内容' },
  reviewed: { en: 'Reviewed practice content', zh: '已审核练习内容' },
  unreviewed: { en: 'Includes questions not yet reviewed', zh: '含尚未审核的练习题' },
}
export const questionLabels: Record<ContentKind, { en: string; zh: string }> = {
  synthetic: { en: 'SYNTHETIC DEVELOPMENT CONTENT', zh: '开发用模拟内容' },
  reviewed: { en: 'REVIEWED PRACTICE', zh: '已审核练习题' },
  unreviewed: { en: 'PRACTICE QUESTION · NOT YET REVIEWED', zh: '练习题 · 尚未审核' },
}
