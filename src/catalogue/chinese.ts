// Reviewed Chinese content → engine catalogue release (Learning Engine §2) and child-facing presentation text.
// Pure: callers pass the parsed public batches (content/chinese/batches), the target lists and, on a parent's
// device only, a private corrective pack. Nothing here reads learner records.
//
// Mapping (proposal for review):
// - A repair item (stage exact/similar/generic) serves that ladder pool for its concrete target; the target
//   ref for the release course is the item's knowledge point, so engine compatibility (same course, knowledge
//   point and assessed skill) credits it only to that target.
// - A general item serves the general pool. Its knowledge point is its declared repair route, so a first wrong
//   answer banks an app-caught mistake on a target that has a complete ladder.
// - Every item is single-answer four-option multiple choice (high_option). Each item is its own context.
import type { CatalogueItem, CatalogueMaterial, CatalogueRelease, KnowledgePoint } from './adapter.ts'
import type { AnyCourse, TargetKind } from '../engine/types.ts'
import type { Exercise, MaterialText } from '../ui/content.ts'

export interface RawOption { id: string; text: string }
export interface RawAnnotation { id: string; text: string; pinyin: string }
export interface RawBlank { id: string; question_id: string }
export interface RawItem {
  id: string
  version: number
  courses: string[]
  target_refs: string[]
  repair_target_refs?: string[] | null
  family: string
  format: string
  stem: string
  options: RawOption[]
  correct_option_id: string
  hint: string
  explanation: string
  material_id: string | null
  stage: 'exact' | 'similar' | 'generic' | null
  blanks: RawBlank[]
  annotations: RawAnnotation[]
  blank_ref: string | null
}
export interface RawMaterial {
  id: string
  version: number
  courses: string[]
  kind: string
  title: string
  body: string
  question_ids: string[]
  blanks: RawBlank[]
  annotations: RawAnnotation[]
}
export interface RawGroup { id: string; target_refs: string[]; item_ids: string[] }
export interface RawBatch {
  batch_id: string
  version: number
  status: string
  curriculum_manifest_version: string
  review_characters_version?: string
  materials: RawMaterial[]
  items: RawItem[]
  groups: RawGroup[]
}
export interface RawSkillTarget { id: string; course: string; kind: string; assessed_skill: string; label_zh: string; word?: string }
export interface RawCharacter { id: string; course: string; character: string }
export interface TargetLists {
  manifest_version: string
  characters: RawCharacter[]
  skill_targets: RawSkillTarget[]
  /** P1 review and owner-approved textbook-extra characters (content/chinese/review-characters.json). */
  review_characters: RawCharacter[]
  extra_characters: RawCharacter[]
}

/** What is known about a concrete target: label, kind, assessed skill and where it came from. */
export interface TargetInfo {
  ref: string
  course: string
  label: string
  kind: TargetKind
  assessed_skill: string
  list: 'grade' | 'p1_review' | 'textbook_extra' | 'skill' | 'private_skill'
}

export interface BuiltContent {
  release: CatalogueRelease
  exercises: Map<string, Exercise>
  materials: Map<string, MaterialText>
  targets: Map<string, TargetInfo>
  /** Review state of the batch that holds each item (approved, author_checked_…, …). */
  itemBatch: Map<string, { batch_id: string; status: string; private: boolean }>
}

const SKILL_KIND: Record<string, TargetKind> = {
  language_point: 'language_point', reading_skill: 'reading_skill', word: 'word',
}

export function targetInfo(lists: TargetLists, privateTargets: RawSkillTarget[] = []): Map<string, TargetInfo> {
  const out = new Map<string, TargetInfo>()
  const char = (list: TargetInfo['list']) => (c: RawCharacter) => out.set(c.id, {
    ref: c.id, course: c.course, label: c.character, kind: 'character', assessed_skill: 'character_recognition', list,
  })
  lists.characters.forEach(char('grade'))
  lists.review_characters.forEach(char('p1_review'))
  lists.extra_characters.forEach(char('textbook_extra'))
  const skill = (list: TargetInfo['list']) => (s: RawSkillTarget) => out.set(s.id, {
    ref: s.id, course: s.course, label: s.word ?? s.label_zh, kind: SKILL_KIND[s.kind] ?? 'language_point',
    assessed_skill: s.assessed_skill, list,
  })
  lists.skill_targets.forEach(skill('skill'))
  privateTargets.forEach(skill('private_skill'))
  return out
}

/** Child-facing text: blanks as （　） (or numbered inside a material), pinyin as 字(pīn yīn). */
export function renderText(text: string, blanks: RawBlank[], annotations: RawAnnotation[], numbered = false): string {
  let out = text
  blanks.forEach((b, i) => { out = out.replace(`{{${b.id}}}`, numbered ? `（${i + 1}）` : '（　）') })
  for (const a of annotations) out = out.replace(`{{${a.id}}}`, `${a.text}（${a.pinyin}）`)
  return out
}

const ID = /^[a-z0-9][a-z0-9_.:-]{0,127}$/

/** A stable, readable release version from the batches it was built from. */
export function releaseVersion(course: string, batches: RawBatch[], privateTag: string | null): string {
  const parts = batches.filter((b) => !b.batch_id.includes('corrective')).map((b) => `${b.batch_id.replace(/^zh-/, '')}v${b.version}`)
  const v = `zh-${course.replace('_higher_chinese', '-hcl').replace('_chinese', '-cl')}-${parts.join('.')}${privateTag ? `:${privateTag}` : ''}`
  return v.toLowerCase()
}

/**
 * Build one engine release for the learner's courses (e.g. P2 and P3 Higher Chinese) from public batches and an
 * optional private corrective batch. Only items tagged for one of those courses are included.
 */
export function buildChineseContent(opts: {
  courses: string[]
  lists: TargetLists
  batches: RawBatch[]
  privateBatches?: RawBatch[]
  privateTargets?: RawSkillTarget[]
  privateTag?: string | null
}): BuiltContent {
  const { courses, lists } = opts
  const targets = targetInfo(lists, opts.privateTargets ?? [])
  const items: CatalogueItem[] = []
  const materials: CatalogueMaterial[] = []
  const exercises = new Map<string, Exercise>()
  const materialText = new Map<string, MaterialText>()
  const itemBatch = new Map<string, { batch_id: string; status: string; private: boolean }>()
  const kps = new Map<string, KnowledgePoint>()
  const all = [...opts.batches.map((b) => [b, false] as const), ...(opts.privateBatches ?? []).map((b) => [b, true] as const)]
  for (const [batch, isPrivate] of all) {
    for (const m of batch.materials) {
      const course = m.courses.find((c) => courses.includes(c))
      if (!course) continue
      materialText.set(m.id, { title: m.title, text: renderText(m.body, m.blanks, m.annotations, true) })
    }
    for (const raw of batch.items) {
      const course = raw.courses.find((c) => courses.includes(c))
      if (!course) continue
      if (raw.format !== 'mcq_4plus') throw new Error(`unsupported_format:${raw.id}`)
      const kp = raw.stage
        ? raw.target_refs.find((r) => r.split('.')[1] === course)
        : (raw.repair_target_refs ?? []).find((r) => r.split('.')[1] === course)
      if (!kp) throw new Error(`no_target_for_course:${raw.id}`)
      const info = targets.get(kp)
      if (!info) throw new Error(`unknown_target:${kp}`)
      if (!ID.test(raw.id)) throw new Error(`bad_item_id:${raw.id}`)
      if (!kps.has(kp)) {
        kps.set(kp, {
          ref: kp, subject: 'chinese', course: course as AnyCourse, target_kind: info.kind, order: kps.size,
          prerequisites: [], teaching_ref: null,
        })
      }
      items.push({
        id: raw.id, version: raw.version, subject: 'chinese', course: course as AnyCourse,
        knowledge_point_ref: kp, assessed_skill: info.assessed_skill,
        pools: raw.stage ? [raw.stage] : ['general'], format_class: 'high_option', response_kind: 'single',
        key: { kind: 'single', option_ids: [raw.correct_option_id], pairs: [] },
        context_ref: raw.id, material_ref: raw.material_id,
      })
      itemBatch.set(raw.id, { batch_id: batch.batch_id, status: batch.status, private: isPrivate })
      const stem = raw.material_id && raw.blank_ref
        ? raw.stem
        : renderText(raw.stem, raw.blanks, raw.annotations)
      exercises.set(raw.id, {
        stem, options: raw.options.map((o) => ({ id: o.id, text: o.text })), hint: raw.hint, explanation: raw.explanation,
        key: { kind: 'single', option_ids: [raw.correct_option_id], pairs: [] },
      })
    }
    for (const m of batch.materials) {
      const course = m.courses.find((c) => courses.includes(c))
      if (!course) continue
      const ids = m.question_ids.filter((q) => items.some((i) => i.id === q))
      materials.push({ ref: m.id, version: m.version, subject: 'chinese', course: course as AnyCourse, family: m.kind, question_ids: ids })
    }
  }
  const publicBatches = opts.batches
  const release: CatalogueRelease = {
    subject: 'chinese',
    version: releaseVersion(courses[0], publicBatches, opts.privateTag ?? null),
    manifest_version: lists.manifest_version,
    development_only: false,
    items, materials, knowledge_points: [...kps.values()],
  }
  return { release, exercises, materials: materialText, targets, itemBatch }
}

/** Usable items per ladder pool for one concrete target in a release. */
export function poolSizes(release: CatalogueRelease, targetRef: string): Record<'exact' | 'similar' | 'generic', number> {
  const out = { exact: 0, similar: 0, generic: 0 }
  for (const i of release.items) {
    if (i.knowledge_point_ref !== targetRef || i.material_ref !== null) continue
    for (const p of i.pools) if (p === 'exact' || p === 'similar' || p === 'generic') out[p] += 1
  }
  return out
}
