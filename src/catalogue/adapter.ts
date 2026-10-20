// The small interface the learning engine reads content through.
// Synthetic fixtures implement it in Issue #17; the reviewed subject content contracts plug in later.
// Releases are versioned and kept side by side so a task pinned to an older version keeps working
// after an update, and a failed install never replaces usable content (F29).
import type { AnyCourse, FormatClass, Response, ResponseKind, Subject, TargetKind } from '../engine/types.ts'

export type Pool = 'exact' | 'similar' | 'generic' | 'general' | 'acquisition'

export interface CatalogueItem {
  id: string
  version: number
  subject: Subject
  course: AnyCourse
  knowledge_point_ref: string
  assessed_skill: string | null
  /** Ladder pools this item may serve; material questions also list the pools they can assess. */
  pools: Pool[]
  format_class: FormatClass
  response_kind: ResponseKind
  /** Objective selected-answer key. */
  key: Response
  /** Items sharing a context are cosmetic variants of each other, never novel-context evidence. */
  context_ref: string
  material_ref: string | null
  /** Controlled error type per wrong option, when content review supports one; otherwise unknown cause. */
  error_types?: Record<string, string>
}

export interface CatalogueMaterial {
  ref: string
  version: number
  subject: Subject
  course: AnyCourse
  family: string
  /** Ordered complete set of formal questions. */
  question_ids: string[]
}

export interface KnowledgePoint {
  ref: string
  subject: Subject
  course: AnyCourse
  target_kind: TargetKind
  /** Syllabus/chapter order; Science acquisition follows it. */
  order: number
  prerequisites: string[]
  /** Science short teaching asset shown before the two acquisition tests (uncounted). */
  teaching_ref: string | null
}

export interface CatalogueRelease {
  subject: Subject
  version: string
  manifest_version: string | null
  /** True for synthetic development content; it must never be presented as reviewed curriculum. */
  development_only: boolean
  items: CatalogueItem[]
  materials: CatalogueMaterial[]
  knowledge_points: KnowledgePoint[]
}

const ID = /^[a-z0-9][a-z0-9_.:-]{0,127}$/

export type InstallResult = { ok: true } | { ok: false; reason: string }

/** Structural release checks. They validate references, never educational quality. */
export function checkRelease(r: CatalogueRelease): string | null {
  if (!ID.test(r.version)) return 'bad_version'
  const items = new Map<string, CatalogueItem>()
  for (const i of r.items) {
    if (!ID.test(i.id) || !Number.isInteger(i.version) || i.version < 1) return `bad_item:${i.id}`
    if (i.subject !== r.subject) return `foreign_subject:${i.id}`
    if (items.has(i.id)) return `duplicate_item:${i.id}`
    const keyed = i.response_kind === 'matching' ? i.key.pairs.length : i.key.option_ids.length
    if (keyed === 0) return `empty_key:${i.id}`
    if (i.key.kind !== i.response_kind) return `key_kind:${i.id}`
    items.set(i.id, i)
  }
  const kps = new Map(r.knowledge_points.map((k) => [k.ref, k]))
  for (const i of r.items) if (!kps.has(i.knowledge_point_ref)) return `unknown_kp:${i.id}`
  for (const m of r.materials) {
    if (m.question_ids.length === 0) return `empty_material:${m.ref}`
    for (const q of m.question_ids) if (items.get(q)?.material_ref !== m.ref) return `material_question:${m.ref}`
  }
  // Prerequisite graph must be acyclic and closed.
  const state = new Map<string, 1 | 2>()
  const visit = (ref: string): boolean => {
    const s = state.get(ref)
    if (s === 2) return true
    if (s === 1) return false
    state.set(ref, 1)
    const kp = kps.get(ref)
    if (!kp) return false
    for (const p of kp.prerequisites) if (!visit(p)) return false
    state.set(ref, 2)
    return true
  }
  for (const k of r.knowledge_points) if (!visit(k.ref)) return `prerequisite_graph:${k.ref}`
  return null
}

export class CatalogueRegistry {
  private releases = new Map<string, CatalogueRelease>()
  private currentBySubject = new Map<Subject, string>()

  /** Install a release. A failed check (or a failed download represented as a thrown loader) keeps current content. */
  install(release: CatalogueRelease): InstallResult {
    const problem = checkRelease(release)
    if (problem) return { ok: false, reason: problem }
    const key = `${release.subject}@${release.version}`
    const previous = this.releases.get(key)
    // A task pins this identity, including its answer keys. Updates need a new version.
    if (previous && JSON.stringify(previous) !== JSON.stringify(release)) return { ok: false, reason: 'version_conflict' }
    this.releases.set(key, deepFreeze(structuredClone(release)))
    this.currentBySubject.set(release.subject, release.version)
    return { ok: true }
  }

  async installFrom(load: () => Promise<CatalogueRelease>): Promise<InstallResult> {
    let release: CatalogueRelease
    try {
      release = await load()
    } catch {
      return { ok: false, reason: 'download_failed' }
    }
    return this.install(release)
  }

  currentVersion(subject: Subject): string | null {
    return this.currentBySubject.get(subject) ?? null
  }

  release(subject: Subject, version: string): CatalogueRelease {
    const r = this.releases.get(`${subject}@${version}`)
    if (!r) throw new Error(`catalogue ${subject}@${version} unavailable`)
    // Stored releases are deep-frozen copies: callers can read them without a per-call clone, and a
    // mutation attempt throws instead of changing content behind an already frozen task.
    return r
  }

  current(subject: Subject): CatalogueRelease | null {
    const v = this.currentVersion(subject)
    return v === null ? null : this.release(subject, v)
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v)
  }
  return value
}

export function itemIn(release: CatalogueRelease, id: string): CatalogueItem {
  const i = release.items.find((x) => x.id === id)
  if (!i) throw new Error(`item ${id} not in ${release.subject}@${release.version}`)
  return i
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

/** Deterministic objective judging against the reviewed key. */
export function judge(item: CatalogueItem, response: Response): boolean {
  if (response.kind !== item.response_kind) return false
  if (item.response_kind === 'matching') {
    const want = new Set(item.key.pairs.map((p) => `${p.left}\u0000${p.right}`))
    const got = new Set(response.pairs.map((p) => `${p.left}\u0000${p.right}`))
    return want.size === got.size && [...want].every((p) => got.has(p)) && response.pairs.length === want.size
  }
  return same(item.key.option_ids, response.option_ids)
}
