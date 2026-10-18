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
  observed: string
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

function onlyKeys(o: unknown, allowed: string[], where: string): asserts o is Record<string, unknown> {
  if (o === null || typeof o !== 'object' || Array.isArray(o)) throw new Error(`pack_shape:${where}`)
  for (const k of Object.keys(o)) if (!allowed.includes(k)) throw new Error(`pack_unknown_key:${where}.${k}`)
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

/** Strict structural validation of a pack read from a file the parent chose. */
export function validatePack(raw: unknown): PrivatePack {
  onlyKeys(raw, ['schema_version', 'pack_id', 'course', 'register', 'corrective_batches', 'private_targets'], 'pack')
  if (raw.schema_version !== 'turtle-private-pack/1') throw new Error('pack_version')
  if (typeof raw.pack_id !== 'string' || !ID.test(raw.pack_id)) throw new Error('pack_id')
  if (raw.course !== 'p2_higher_chinese' && raw.course !== 'p2_chinese') throw new Error('pack_course')
  const reg = raw.register
  onlyKeys(reg, ['schema_version', 'register_id', 'course', 'policy', 'review_complete', 'cases'], 'register')
  if (reg.schema_version !== 'anonymous-mistake-register/1' || reg.course !== raw.course) throw new Error('register_version')
  if (typeof reg.register_id !== 'string' || !ID.test(reg.register_id)) throw new Error('register_id')
  if (!Array.isArray(reg.cases) || reg.cases.length === 0 || reg.cases.length > 2000) throw new Error('register_cases')
  const seen = new Set<string>()
  for (const c of reg.cases) {
    onlyKeys(c, ['id', 'target', 'observation_type', 'observed', 'review_status', 'cause', 'source_interpretation_uncertain',
      'correction_status', 'route', 'production_followup'], 'case')
    if (typeof c.id !== 'string' || !CASE_ID.test(c.id) || seen.has(c.id)) throw new Error(`case_id:${String(c.id)}`)
    seen.add(c.id)
    for (const f of ['target', 'observed'] as const) {
      const v = c[f]
      if (typeof v !== 'string' || v.length === 0 || v.length > 80 || DATE_LIKE.test(v)) throw new Error(`case_text:${c.id}.${f}`)
    }
    if (!['character', 'word', 'pinyin', 'reading', 'writing', 'speaking'].includes(c.observation_type as string)) throw new Error(`case_type:${c.id}`)
    if (c.review_status !== 'parent_accepted') throw new Error(`case_not_accepted:${c.id}`)
    const r = c.route as Record<string, unknown>
    if (r?.mode === 'objective') {
      onlyKeys(r, ['mode', 'progress_target_ref', 'batch_id', 'batch_version', 'content_state', 'stages', 'ready_for_runtime'], `${c.id}.route`)
      if (typeof r.progress_target_ref !== 'string' || !ID.test(r.progress_target_ref)) throw new Error(`case_route_ref:${c.id}`)
      if (r.progress_target_ref.split('.')[1] !== raw.course) throw new Error(`case_route_course:${c.id}`)
    } else if (r?.mode === 'external') {
      onlyKeys(r, ['mode', 'plan'], `${c.id}.route`)
      plan(r.plan, `${c.id}.route.plan`)
    } else throw new Error(`case_route:${c.id}`)
    if (c.production_followup !== undefined) plan(c.production_followup, `${c.id}.production_followup`)
  }
  if (!Array.isArray(raw.corrective_batches) || !Array.isArray(raw.private_targets)) throw new Error('pack_content')
  for (const t of raw.private_targets as RawSkillTarget[]) {
    if (typeof t.id !== 'string' || !ID.test(t.id) || t.course !== raw.course) throw new Error(`pack_target:${String(t.id)}`)
  }
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
    const entry = out.get(p.id) ?? { plan: p, cases: [] }
    entry.cases.push(c.id)
    out.set(p.id, entry)
  }
  return out
}
