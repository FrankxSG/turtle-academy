// Original fixed DEVELOPMENT fixtures, not curriculum content or a subject release.
// Copies share context IDs: repeated synthetic examples never claim novel-context mastery.
import {
  CatalogueRegistry,
  type CatalogueItem,
  type CatalogueRelease,
} from '../catalogue/adapter.ts'
import type { AnyCourse, Subject } from '../engine/types.ts'
import { registerExercise, registerMaterial, type Exercise } from './content.ts'

export { exercise, material, type Exercise } from './content.ts'

export type Language = 'en' | 'zh'
export const subjects: Subject[] = [
  'chinese',
  'science',
  'mathematics',
  'english',
]
export const names = {
  en: {
    chinese: 'Chinese',
    science: 'Science',
    mathematics: 'Mathematics',
    english: 'English',
  },
  zh: {
    chinese: '华文',
    science: '科学',
    mathematics: '数学',
    english: '英文',
  },
}
const fixed = (zh: boolean): Exercise[] => [
  {
    stem: zh ? '哪一个是圆形？' : 'Which shape is a circle?',
    options: [
      { id: 'a', text: '●' },
      { id: 'b', text: '■' },
      { id: 'c', text: '▲' },
      { id: 'd', text: '★' },
    ],
    hint: zh ? '看看哪一个没有角。' : 'Look for a shape without corners.',
    explanation: zh ? '● 是圆形。' : '● is a circle.',
    key: { kind: 'single', option_ids: ['a'], pairs: [] },
  },
  {
    stem: zh
      ? '用词语填空：图上有一个____。'
      : 'Choose a word: the picture shows a ____.',
    options: [
      { id: 'circle', text: zh ? '圆形' : 'circle' },
      { id: 'square', text: zh ? '正方形' : 'square' },
      { id: 'star', text: zh ? '星形' : 'star' },
      { id: 'triangle', text: zh ? '三角形' : 'triangle' },
    ],
    hint: zh ? '再看看图上的 ●。' : 'Look again at ●.',
    explanation: zh ? '图上有一个圆形。' : 'The picture shows a circle.',
    key: { kind: 'word_bank', option_ids: ['circle'], pairs: [] },
  },
  {
    stem: zh
      ? '照图排列：● → ■ → ▲。点击选项排列。'
      : 'Copy this order: ● → ■ → ▲. Tap the shapes in order.',
    options: [
      { id: 'square', text: '■' },
      { id: 'triangle', text: '▲' },
      { id: 'circle', text: '●' },
    ],
    hint: zh
      ? '先找圆形，再找正方形。'
      : 'Start with the circle, then the square.',
    explanation: '● → ■ → ▲',
    key: {
      kind: 'ordered',
      option_ids: ['circle', 'square', 'triangle'],
      pairs: [],
    },
  },
  {
    stem: zh ? '把相同的形状连起来。' : 'Match each shape to the same shape.',
    left: [
      { id: 'l1', text: '●' },
      { id: 'l2', text: '■' },
    ],
    options: [
      { id: 'r2', text: '■' },
      { id: 'r1', text: '●' },
    ],
    hint: zh ? '逐个比较两边的形状。' : 'Compare the shapes on both sides.',
    explanation: '● ↔ ●；■ ↔ ■',
    key: {
      kind: 'matching',
      option_ids: [],
      pairs: [
        { left: 'l1', right: 'r1' },
        { left: 'l2', right: 'r2' },
      ],
    },
  },
]
/**
 * Development fixtures for every subject, or only for the subjects listed (a subject with reviewed content
 * installs that release instead). Synthetic content is never presented as reviewed curriculum.
 */
export function developmentRegistry(
  only: readonly Subject[] = subjects,
  registry = new CatalogueRegistry(),
): CatalogueRegistry {
  for (const subject of only) {
    const zh = subject === 'chinese'
    const course: AnyCourse = (
      {
        chinese: 'p2_chinese',
        science: 'p3_science',
        mathematics: 'p2_mathematics',
        english: 'p2_english',
      } as const
    )[subject]
    const kp = `dev-${subject}-shapes`
    const defs = fixed(zh)
    const items: CatalogueItem[] = []
    const add = (
      id: string,
      n: number,
      materialRef: string | null,
      acquisition = false,
    ) => {
      const e = defs[n % defs.length]
      registerExercise(id, e)
      items.push({
        id,
        version: 1,
        subject,
        course,
        knowledge_point_ref: kp,
        assessed_skill: 'shape_selection',
        pools: acquisition
          ? ['acquisition']
          : ['general', 'exact', 'similar', 'generic'],
        format_class: 'high_option',
        response_kind: e.key.kind,
        key: e.key,
        context_ref: `dev-shape-context-${n % defs.length}`,
        material_ref: materialRef,
      })
    }
    const release: CatalogueRelease = {
      subject,
      version: 'dev-ui-1',
      manifest_version: null,
      development_only: true,
      items,
      materials: [],
      knowledge_points: [
        {
          ref: kp,
          subject,
          course,
          target_kind:
            subject === 'science' ? 'science_concept' : 'language_point',
          order: 1,
          prerequisites: [],
          teaching_ref: subject === 'science' ? 'dev-shapes' : null,
        },
      ],
    }
    if (subject === 'chinese' || subject === 'english') {
      for (let m = 0; m < 5; m++) {
        const ref = `dev-${subject}-material-${m}`
        registerMaterial(ref, {
          title: zh ? `图形卡 ${m + 1}` : `Shape card ${m + 1}`,
          text: zh
            ? '小海龟找到三个形状：●、■、▲。它把圆形放在前面，然后放正方形，最后放三角形。'
            : 'Turtle found three shapes: ●, ■ and ▲. The circle comes first, then the square, then the triangle.',
        })
        // Different fixed material sizes exercise combined safe-boundary checkpoints in English.
        const count = subject === 'english' && m < 2 ? [2, 4][m] : 3
        const ids = Array.from({ length: count }, (_, q) => {
          const id = `${ref}-q${q}`
          add(id, m + q, ref)
          return id
        })
        release.materials.push({
          ref,
          version: 1,
          subject,
          course,
          family: ['passage', 'visual', 'cloze'][m % 3],
          question_ids: ids,
        })
      }
    }
    if (subject === 'science') {
      add('dev-science-test-a', 0, null, true)
      add('dev-science-test-b', 3, null, true)
    }
    for (let i = 0; i < 24; i++) add(`dev-${subject}-short-${i}`, i, null)
    const installed = registry.install(release)
    if (!installed.ok) throw new Error('development_catalogue_invalid')
  }
  return registry
}
