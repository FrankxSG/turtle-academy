// SYNTHETIC DEVELOPMENT CONTENT — test fixtures only. Not curriculum, not reviewed, never shipped.
// Kept under tests/ so nothing here can enter a release catalogue path.
import type { CatalogueItem, CatalogueMaterial, CatalogueRelease, KnowledgePoint, Pool } from '../../../src/catalogue/adapter.ts'
import type { AnyCourse, FormatClass, Subject, TargetKind } from '../../../src/engine/types.ts'

interface ItemOpts { pools: Pool[]; format?: FormatClass; material?: string | null; context?: string; version?: number; kind?: 'single' | 'ordered' | 'matching'; skill?: string | null }

export function item(subject: Subject, course: AnyCourse, kp: string, id: string, o: ItemOpts): CatalogueItem {
  const format = o.format ?? 'high_option'
  const kind = o.kind ?? 'single'
  const key = kind === 'matching'
    ? { kind, option_ids: [], pairs: [{ left: 'l1', right: 'r1' }, { left: 'l2', right: 'r2' }] }
    : kind === 'ordered'
      ? { kind, option_ids: ['w1', 'w2', 'w3'], pairs: [] }
      : { kind, option_ids: [format === 'high_option' ? 'a' : 't'], pairs: [] }
  return {
    id, version: o.version ?? 1, subject, course, knowledge_point_ref: kp, assessed_skill: o.skill ?? null, pools: o.pools,
    format_class: format, response_kind: kind, key, context_ref: o.context ?? `ctx-${id}`, material_ref: o.material ?? null,
    error_types: format === 'high_option' ? { b: 'confused_form' } : undefined,
  }
}

const kpDef = (subject: Subject, course: AnyCourse, ref: string, order: number, kind: TargetKind, prerequisites: string[] = [], teaching: string | null = null): KnowledgePoint =>
  ({ ref, subject, course, target_kind: kind, order, prerequisites, teaching_ref: teaching })

/** Ladder items for one knowledge point: per stage, two high-option and two low-option items, plus general items. */
function ladder(subject: Subject, course: AnyCourse, kp: string, general = 3): CatalogueItem[] {
  const out: CatalogueItem[] = []
  for (const stage of ['exact', 'similar', 'generic'] as const) {
    for (let i = 1; i <= 2; i++) out.push(item(subject, course, kp, `${kp}-${stage}-h${i}`, { pools: [stage] }))
    for (let i = 1; i <= 2; i++) out.push(item(subject, course, kp, `${kp}-${stage}-l${i}`, { pools: [stage], format: 'low_option' }))
  }
  for (let i = 1; i <= general; i++) out.push(item(subject, course, kp, `${kp}-gen-${i}`, { pools: ['general'] }))
  return out
}

function languageRelease(subject: 'chinese' | 'english', version = 'syn-1'): CatalogueRelease {
  const p2: AnyCourse = subject === 'chinese' ? 'p2_chinese' : 'p2_english'
  const p3: AnyCourse = subject === 'chinese' ? 'p3_chinese' : 'p3_english'
  const s = subject === 'chinese' ? 'zh' : 'en'
  const kps = [1, 2, 3, 4, 5, 6].map((n) => kpDef(subject, p2, `${s}-kp${n}`, n, subject === 'chinese' ? 'word' : 'vocabulary'))
  kps.push(kpDef(subject, p3, `${s}-p3-kp1`, 7, 'reading_skill'))
  const items: CatalogueItem[] = kps.flatMap((k) => ladder(subject, k.course, k.ref))
  const materials: CatalogueMaterial[] = []
  const families = ['passage', 'visual', 'cloze']
  // Twelve P2 materials with three questions each; each material touches three knowledge points.
  for (let m = 1; m <= 12; m++) {
    const ref = `${s}-mat${m}`
    const qids: string[] = []
    for (let q = 0; q < 3; q++) {
      const kp = kps[(m + q) % 6].ref
      const id = `${ref}-q${q + 1}`
      items.push(item(subject, p2, kp, id, { pools: ['exact', 'similar', 'generic', 'general'], material: ref, format: q === 2 ? 'low_option' : 'high_option' }))
      qids.push(id)
    }
    materials.push({ ref, version: 1, subject, course: p2, family: families[m % 3], question_ids: qids })
  }
  // One P3 material: general practice is open from the first release.
  const p3ref = `${s}-p3-mat1`
  const p3q = [1, 2, 3].map((q) => { const id = `${p3ref}-q${q}`; items.push(item(subject, p3, `${s}-p3-kp1`, id, { pools: ['general'], material: p3ref })); return id })
  materials.push({ ref: p3ref, version: 1, subject, course: p3, family: 'passage', question_ids: p3q })
  return { subject, version, manifest_version: null, development_only: true, items, materials, knowledge_points: kps }
}

export function mathematicsRelease(version = 'syn-1'): CatalogueRelease {
  const kps = [1, 2, 3].map((n) => kpDef('mathematics', 'p2_mathematics', `ma-kp${n}`, n, 'math_relationship'))
  kps.push(kpDef('mathematics', 'p3_mathematics', 'ma-p3-kp1', 9, 'math_method'))
  const items = kps.flatMap((k) => ladder('mathematics', k.course, k.ref, 6))
  items.push(item('mathematics', 'p2_mathematics', 'ma-kp1', 'ma-kp1-match', { pools: ['general'], kind: 'matching' }))
  items.push(item('mathematics', 'p2_mathematics', 'ma-kp1', 'ma-kp1-order', { pools: ['general'], kind: 'ordered' }))
  return { subject: 'mathematics', version, manifest_version: null, development_only: true, items, materials: [], knowledge_points: kps }
}

/** Science: sci-1 → sci-2 → sci-4 dependency chain; sci-3 is independent. Three acquisition contexts each. */
export function scienceRelease(version = 'syn-1', generalPerKp = 3): CatalogueRelease {
  const kps = [
    kpDef('science', 'p3_science', 'sci-1', 1, 'science_concept', [], 'teach-sci-1'),
    kpDef('science', 'p3_science', 'sci-2', 2, 'science_concept', ['sci-1'], 'teach-sci-2'),
    kpDef('science', 'p3_science', 'sci-3', 3, 'science_concept', [], 'teach-sci-3'),
    kpDef('science', 'p3_science', 'sci-4', 4, 'science_concept', ['sci-2'], 'teach-sci-4'),
  ]
  const items: CatalogueItem[] = []
  for (const k of kps) {
    items.push(...ladder('science', 'p3_science', k.ref, generalPerKp))
    for (let c = 1; c <= 3; c++) items.push(item('science', 'p3_science', k.ref, `${k.ref}-acq-${c}`, { pools: ['acquisition'], context: `${k.ref}-ctx${c}` }))
  }
  return { subject: 'science', version, manifest_version: null, development_only: true, items, materials: [], knowledge_points: kps }
}

export const chineseRelease = (v = 'syn-1') => languageRelease('chinese', v)
export const englishRelease = (v = 'syn-1') => languageRelease('english', v)
