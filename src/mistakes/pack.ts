// The parent's private pack: the accepted anonymous mistake register, its corrective content and the draft
// concrete targets that content needs. It is prepared in the private resources repository and installed on the
// parent's device only. It never ships in the public build, CI or previews.
//
// Validation is structural and deliberately strict: unknown keys are rejected, so an identity field, a date, a
// note or a source reference cannot ride along into device storage or exports.
import type { RawBatch, RawSkillTarget } from '../catalogue/chinese.ts'

export type ObservationType = 'character' | 'word' | 'pinyin' | 'reading' | 'writing' | 'speaking'
export type ProductionMode = 'external_writing' | 'external_speaking'
export type PlanStage = 'exact' | 'similar' | 'generic'

export interface ProductionPlan {
  id: string
  mode: ProductionMode
  stages: Record<PlanStage, { prompt: string; verification: 'parent_observation'; automatically_scored: false }>
  success_rule: string
}

export interface StagePin { item_id: string; version: number }

export interface ObjectiveRoute {
  mode: 'objective'
  progress_target_ref: string
  batch_id: string
  batch_version: number
  content_state: string
  stages: Record<PlanStage, StagePin[]>
  ready_for_runtime: boolean
}
export interface ExternalRoute { mode: 'external'; plan: ProductionPlan }

export interface RegisterCase {
  id: string
  target: string
  observation_type: ObservationType
  /**
   * The wrong form. Device-only: present only on the device that loaded the pack; it is removed before upload, so a
   * pack recovered from sync has no `observed` and repair works from the correct target alone.
   */
  observed?: string
  review_status: 'parent_accepted'
  cause: string
  source_interpretation_uncertain: boolean
  correction_status: string
  route: ObjectiveRoute | ExternalRoute
  production_followup?: ProductionPlan
}

export interface Register {
  schema_version: 'anonymous-mistake-register/1'
  register_id: string
  course: string
  policy: string
  review_complete: boolean
  cases: RegisterCase[]
}

export interface PrivatePack {
  schema_version: 'turtle-private-pack/1'
  pack_id: string
  course: string
  register: Register
  corrective_batches: RawBatch[]
  private_targets: RawSkillTarget[]
}

const CASE_ID = /^O[0-9]{3}$/
const ID = /^[a-z0-9][a-z0-9_.:-]{0,127}$/
const DATE_LIKE = /\b(19|20)[0-9]{2}-[01][0-9]-[0-3][0-9]\b/
const STAGES: PlanStage[] = ['exact', 'similar', 'generic']

// Reject identity-like keys anywhere, including otherwise unconsumed nested metadata.
// This structural guard does not identify a person's name hidden in permitted learning text.
export function assertAnonymousStructure(value: unknown): void {
  if (Array.isArray(value)) { value.forEach(assertAnonymousStructure); return }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      const k = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
      if (/name|email|device|school|teacher|password|credential|token|session|account|(?:parent|child|student|learner|user)(?:id|profile|identifier)|class(?:id|room)?$/.test(k))
        throw new Error('pack_identity_field')
      assertAnonymousStructure(v)
    }
  }
  if (typeof value === 'string' && /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i.test(value))
    throw new Error('pack_identity_value')
}

function onlyKeys(o: unknown, allowed: string[], where: string): asserts o is Record<string, unknown> {
  if (o === null || typeof o !== 'object' || Array.isArray(o)) throw new Error(`pack_shape:${where}`)
  for (const k of Object.keys(o)) if (!allowed.includes(k)) throw new Error(`pack_unknown_key:${where}`)
}

function plan(p: unknown, where: string): ProductionPlan {
  onlyKeys(p, ['id', 'mode', 'stages', 'success_rule'], where)
  if (typeof p.id !== 'string' || !/^[a-z0-9][a-z0-9_.:-]{0,160}$/.test(p.id)) throw new Error(`pack_plan_id:${where}`)
  if (p.mode !== 'external_writing' && p.mode !== 'external_speaking') throw new Error(`pack_plan_mode:${where}`)
  onlyKeys(p.stages, STAGES, `${where}.stages`)
  for (const s of STAGES) {
    const st = (p.stages as Record<string, unknown>)[s]
    onlyKeys(st, ['prompt', 'verification', 'automatically_scored'], `${where}.stages.${s}`)
    if (typeof st.prompt !== 'string' || st.prompt.length === 0 || st.prompt.length > 400) throw new Error(`pack_plan_prompt:${where}`)
    if (st.verification !== 'parent_observation' || st.automatically_scored !== false) throw new Error(`pack_plan_scoring:${where}`)
  }
  if (typeof p.success_rule !== 'string' || p.success_rule.length > 1200) throw new Error(`pack_plan_rule:${where}`)
  return p as unknown as ProductionPlan
}

function positive(value: unknown): boolean { return Number.isSafeInteger(value) && Number(value) > 0 }
function strings(value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) throw new Error('pack_string_array')
}
function textSlots(value: Record<string, unknown>) {
  if (!Array.isArray(value.blanks) || !Array.isArray(value.annotations)) throw new Error('pack_text_slots')
  for (const b of value.blanks) {
    onlyKeys(b, ['id', 'question_id'], 'blank')
    if (typeof b.id !== 'string' || typeof b.question_id !== 'string') throw new Error('pack_blank')
  }
  for (const a of value.annotations) {
    onlyKeys(a, ['id', 'text', 'pinyin'], 'annotation')
    if ([a.id, a.text, a.pinyin].some((v) => typeof v !== 'string')) throw new Error('pack_annotation')
  }
}

/** Strict structural validation of a pack read from a file the parent chose. */
export function validatePack(raw: unknown): PrivatePack {
  assertAnonymousStructure(raw)
  onlyKeys(raw, ['schema_version', 'pack_id', 'course', 'register', 'corrective_batches', 'private_targets'], 'pack')
  if (raw.schema_version !== 'turtle-private-pack/1') throw new Error('pack_version')
  if (typeof raw.pack_id !== 'string' || !ID.test(raw.pack_id)) throw new Error('pack_id')
  if (raw.course !== 'p2_higher_chinese' && raw.course !== 'p2_chinese') throw new Error('pack_course')
  const reg = raw.register
  onlyKeys(reg, ['schema_version', 'register_id', 'course', 'policy', 'review_complete', 'cases'], 'register')
  if (reg.schema_version !== 'anonymous-mistake-register/1' || reg.course !== raw.course) throw new Error('register_version')
  if (typeof reg.register_id !== 'string' || !ID.test(reg.register_id)) throw new Error('register_id')
  if (!Array.isArray(reg.cases) || reg.cases.length === 0 || reg.cases.length > 2000) throw new Error('register_cases')
  if (reg.review_complete !== true || typeof reg.policy !== 'string') throw new Error('register_not_reviewed')
  const seen = new Set<string>()
  for (const c of reg.cases) {
    onlyKeys(c, ['id', 'target', 'observation_type', 'observed', 'review_status', 'cause', 'source_interpretation_uncertain',
      'correction_status', 'route', 'production_followup'], 'case')
    if (typeof c.id !== 'string' || !CASE_ID.test(c.id) || seen.has(c.id)) throw new Error(`case_id:${String(c.id)}`)
    seen.add(c.id)
    for (const f of ['target', 'observed'] as const) {
      const v = c[f]
      if (f === 'observed' && v === undefined) continue // absent on a pack recovered from sync
      if (typeof v !== 'string' || v.length === 0 || v.length > 80 || DATE_LIKE.test(v)) throw new Error(`case_text:${c.id}.${f}`)
    }
    if (!['character', 'word', 'pinyin', 'reading', 'writing', 'speaking'].includes(c.observation_type as string)) throw new Error(`case_type:${c.id}`)
    if (c.review_status !== 'parent_accepted') throw new Error(`case_not_accepted:${c.id}`)
    if (typeof c.source_interpretation_uncertain !== 'boolean' || typeof c.cause !== 'string' || typeof c.correction_status !== 'string') throw new Error('case_metadata')
    const r = c.route as Record<string, unknown>
    if (r?.mode === 'objective') {
      onlyKeys(r, ['mode', 'progress_target_ref', 'batch_id', 'batch_version', 'content_state', 'stages', 'ready_for_runtime'], `${c.id}.route`)
      if (typeof r.progress_target_ref !== 'string' || !ID.test(r.progress_target_ref)) throw new Error(`case_route_ref:${c.id}`)
      if (r.progress_target_ref.split('.')[1] !== raw.course) throw new Error(`case_route_course:${c.id}`)
      if (typeof r.batch_id !== 'string' || !ID.test(r.batch_id) || !positive(r.batch_version) || typeof r.content_state !== 'string' || typeof r.ready_for_runtime !== 'boolean') throw new Error('case_route_metadata')
      onlyKeys(r.stages, STAGES, 'route_stages')
      for (const stage of STAGES) {
        const pins = r.stages[stage]
        if (!Array.isArray(pins)) throw new Error('case_stage_pins')
        for (const pin of pins) {
          onlyKeys(pin, ['item_id', 'version'], 'stage_pin')
          if (typeof pin.item_id !== 'string' || !ID.test(pin.item_id) || !positive(pin.version)) throw new Error('case_stage_pin')
        }
      }
    } else if (r?.mode === 'external') {
      onlyKeys(r, ['mode', 'plan'], `${c.id}.route`)
      plan(r.plan, `${c.id}.route.plan`)
    } else throw new Error(`case_route:${c.id}`)
    if (c.production_followup !== undefined) plan(c.production_followup, `${c.id}.production_followup`)
  }
  if (!Array.isArray(raw.corrective_batches) || !Array.isArray(raw.private_targets)) throw new Error('pack_content')
  const targetIds = new Set<string>()
  for (const t of raw.private_targets) {
    onlyKeys(t, ['id', 'course', 'outcome_ref', 'kind', 'label_zh', 'assessed_skill', 'word'], 'private_target')
    if (typeof t.id !== 'string' || !ID.test(t.id) || t.course !== raw.course || targetIds.has(t.id)) throw new Error('pack_target')
    targetIds.add(t.id)
    for (const f of ['word', 'outcome_ref']) if (t[f] !== undefined && typeof t[f] !== 'string') throw new Error('pack_target_metadata')
    if (!['word', 'language_point', 'reading_skill'].includes(String(t.kind)) || typeof t.label_zh !== 'string' || typeof t.assessed_skill !== 'string') throw new Error('pack_target_shape')
    if (t.kind === 'word' && typeof t.word !== 'string') throw new Error('pack_target_word')
  }
  const batches = new Set<string>(), itemIds = new Set<string>()
  for (const b of raw.corrective_batches) {
    onlyKeys(b, ['batch_id', 'version', 'status', 'curriculum_manifest_version', 'review_characters_version', 'materials', 'items', 'groups'], 'batch')
    if (typeof b.batch_id !== 'string' || !ID.test(b.batch_id) || batches.has(b.batch_id) || !positive(b.version) || typeof b.status !== 'string' || typeof b.curriculum_manifest_version !== 'string') throw new Error('pack_batch')
    batches.add(b.batch_id)
    if (b.review_characters_version !== undefined && typeof b.review_characters_version !== 'string') throw new Error('pack_batch_list_version')
    if (!Array.isArray(b.items) || !Array.isArray(b.materials) || !Array.isArray(b.groups)) throw new Error('pack_batch_arrays')
    for (const item of b.items) {
      onlyKeys(item, ['id', 'version', 'courses', 'outcome_refs', 'target_refs', 'repair_target_refs', 'family', 'format', 'stem', 'options', 'correct_option_id', 'hint', 'explanation', 'rationale', 'material_id', 'stage', 'provenance', 'asset_refs', 'blanks', 'annotations', 'blank_ref'], 'item')
      if (typeof item.id !== 'string' || !ID.test(item.id) || itemIds.has(item.id) || !positive(item.version)) throw new Error('pack_item')
      itemIds.add(item.id)
      strings(item.courses); strings(item.target_refs)
      if (item.repair_target_refs !== null && item.repair_target_refs !== undefined) strings(item.repair_target_refs)
      for (const field of ['outcome_refs', 'asset_refs']) if (item[field] !== undefined) strings(item[field])
      for (const field of ['stem', 'hint', 'explanation', 'family', 'correct_option_id']) if (typeof item[field] !== 'string') throw new Error('pack_item_text')
      for (const field of ['rationale', 'provenance']) if (item[field] !== undefined && typeof item[field] !== 'string') throw new Error('pack_item_metadata')
      if (item.format !== 'mcq_4plus' || ![null, ...STAGES].includes(item.stage as PlanStage | null)) throw new Error('pack_item_format')
      if (!Array.isArray(item.options) || item.options.length < 4 || item.options.length > 12) throw new Error('pack_options')
      const ids = new Set(), texts = new Set()
      for (const option of item.options) {
        onlyKeys(option, ['id', 'text'], 'option')
        if (typeof option.id !== 'string' || typeof option.text !== 'string' || ids.has(option.id) || texts.has(option.text)) throw new Error('pack_option')
        ids.add(option.id); texts.add(option.text)
      }
      if (!ids.has(item.correct_option_id)) throw new Error('pack_key')
      textSlots(item)
      if (item.material_id !== null && typeof item.material_id !== 'string') throw new Error('pack_material_ref')
      if (item.blank_ref !== null && typeof item.blank_ref !== 'string') throw new Error('pack_blank_ref')
    }
    for (const m of b.materials) {
      onlyKeys(m, ['id', 'version', 'courses', 'kind', 'title', 'body', 'question_ids', 'blanks', 'annotations', 'outcome_refs', 'provenance', 'asset_refs'], 'material')
      if (typeof m.id !== 'string' || !positive(m.version)) throw new Error('pack_material')
      for (const f of ['kind', 'title', 'body']) if (typeof m[f] !== 'string') throw new Error('pack_material_text')
      strings(m.courses); strings(m.question_ids); textSlots(m)
      for (const f of ['outcome_refs', 'asset_refs']) if (m[f] !== undefined) strings(m[f])
      if (m.provenance !== undefined && typeof m.provenance !== 'string') throw new Error('pack_material_metadata')
    }
    for (const g of b.groups) {
      onlyKeys(g, ['id', 'version', 'label_zh', 'label_en', 'courses', 'target_refs', 'item_ids'], 'group')
      if (typeof g.id !== 'string') throw new Error('pack_group')
      strings(g.target_refs); strings(g.item_ids)
      if (g.courses !== undefined) strings(g.courses)
      if (g.version !== undefined && !positive(g.version)) throw new Error('pack_group_version')
      for (const f of ['label_zh', 'label_en']) if (g[f] !== undefined && typeof g[f] !== 'string') throw new Error('pack_group_label')
    }
  }
  productionPlans(reg as unknown as Register) // conflicting shared production plans must not silently overwrite
  return raw as unknown as PrivatePack
}

/** A short stable tag for a pack, used in the engine release version so tasks pin the exact pack. */
export function packTag(pack: PrivatePack): string {
  return pack.pack_id.replace(/[^a-z0-9]/g, '').slice(-24) || 'private'
}

/** Production plans referenced by the register, de-duplicated by plan id (shared targets share a plan). */
export function productionPlans(register: Register): Map<string, { plan: ProductionPlan; cases: string[] }> {
  const out = new Map<string, { plan: ProductionPlan; cases: string[] }>()
  for (const c of register.cases) {
    const p = c.route.mode === 'external' ? c.route.plan : c.production_followup
    if (!p) continue
    const existing = out.get(p.id)
    if (existing && JSON.stringify(existing.plan) !== JSON.stringify(p)) throw new Error('pack_conflicting_plan')
    const entry = existing ?? { plan: p, cases: [] }
    entry.cases.push(c.id)
    out.set(p.id, entry)
  }
  return out
}
