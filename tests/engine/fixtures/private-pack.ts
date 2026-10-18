// A SYNTHETIC private pack for tests. The cases are invented and point at generic public targets; they are not
// any learner's records. Real packs are built in the private resources repository and never committed here.
import type { RawBatch, RawItem } from '../../../src/catalogue/chinese.ts'
import { publicChinese } from './public-chinese.ts'
const publicItems = publicChinese().batches.flatMap((b) => b.items)
const pinsFor = (ref: string) => Object.fromEntries(['exact', 'similar', 'generic'].map((stage) => [stage, publicItems.filter((q) => q.stage === stage && q.target_refs.includes(ref)).map((q) => ({ item_id: q.id, version: q.version }))]))

const plan = (id: string, mode: 'external_writing' | 'external_speaking') => ({
  id, mode,
  stages: {
    exact: { prompt: '看示范，写一次。', verification: 'parent_observation', automatically_scored: false },
    similar: { prompt: '盖住示范，独立写一次。', verification: 'parent_observation', automatically_scored: false },
    generic: { prompt: '隔一天，在新句子里独立写。', verification: 'parent_observation', automatically_scored: false },
  },
  success_rule: 'Hide the model; help is supported practice.',
})

const objective = (id: string, target: string, ref: string, extra: Record<string, unknown> = {}) => ({
  id, target, observation_type: 'character', observed: '形近字', review_status: 'parent_accepted', cause: 'unknown',
  source_interpretation_uncertain: false, correction_status: 'no_practice_evidence_received',
  route: { mode: 'objective', progress_target_ref: ref, batch_id: 'any', batch_version: 1, content_state: 'synthetic', stages: pinsFor(ref), ready_for_runtime: false },
  ...extra,
})

const item = (id: string, stage: 'exact' | 'similar' | 'generic', ref: string, key: string): RawItem => ({
  id, version: 1, courses: ['p2_higher_chinese'], target_refs: [ref], repair_target_refs: null, family: 'character', format: 'mcq_4plus',
  stem: '“好”字读哪个拼音？', options: [{ id: 'opt-1', text: 'hǎo' }, { id: 'opt-2', text: 'hāo' }, { id: 'opt-3', text: 'háo' }, { id: 'opt-4', text: 'hào' }],
  correct_option_id: key, hint: '先小声读一读。', explanation: '这里读 hǎo。', material_id: null, stage, blanks: [], annotations: [], blank_ref: null,
})

export const PRIVATE_REF = 'zh.p2_higher_chinese.skill.synthetic-sound'

export function syntheticPack(opts: { pendingRef: string; extraCase?: boolean } ) {
  const batch: RawBatch = {
    batch_id: 'zh-corrective-test', version: 1, status: 'author_checked_pending_independent_and_owner_review',
    curriculum_manifest_version: 'x', materials: [], groups: [],
    items: [item('zh-ct-sound.exact', 'exact', PRIVATE_REF, 'opt-1'), item('zh-ct-sound.similar', 'similar', PRIVATE_REF, 'opt-1'), item('zh-ct-sound.generic', 'generic', PRIVATE_REF, 'opt-1')],
  }
  const cases = [
    objective('O901', '座', 'zh.p2_higher_chinese.char.u5ea7', { production_followup: plan('production-zh.p2_higher_chinese.char.u5ea7', 'external_writing') }),
    objective('O902', '座', 'zh.p2_higher_chinese.char.u5ea7', { production_followup: plan('production-zh.p2_higher_chinese.char.u5ea7', 'external_writing') }),
    objective('O903', '住', 'zh.p2_higher_chinese.char.u4f4f'),
    objective('O904', 'hǎo', PRIVATE_REF, { observation_type: 'pinyin' }),
    objective('O905', '未备题', opts.pendingRef),
    {
      id: 'O906', target: '完整句子', observation_type: 'writing', observed: '少一个词', review_status: 'parent_accepted', cause: 'unknown',
      source_interpretation_uncertain: true, correction_status: 'no_practice_evidence_received',
      route: { mode: 'external', plan: plan('external-o906', 'external_writing') },
    },
  ]
  const soundCase = cases.find((c) => c.id === 'O904')!
  if (soundCase.route.mode === 'objective') soundCase.route.stages = Object.fromEntries(['exact', 'similar', 'generic'].map((stage) => [stage, batch.items.filter((q) => q.stage === stage).map((q) => ({ item_id: q.id, version: q.version }))]))
  if (opts.extraCase) cases.push(objective('O907', '住', 'zh.p2_higher_chinese.char.u4f4f'))
  return {
    schema_version: 'turtle-private-pack/1', pack_id: opts.extraCase ? 'test-pack-2' : 'test-pack-1', course: 'p2_higher_chinese',
    register: {
      schema_version: 'anonymous-mistake-register/1', register_id: 'synthetic-register', course: 'p2_higher_chinese',
      policy: 'synthetic', review_complete: true, cases,
    },
    corrective_batches: [batch],
    private_targets: [{ id: PRIVATE_REF, course: 'p2_higher_chinese', kind: 'word', assessed_skill: 'character_recognition', label_zh: '拼音：好', word: '好' }],
  }
}
