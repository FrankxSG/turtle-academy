// Engine record types. They mirror the closed `pilot-snapshot/1` allow-list (src/snapshot/schema.json)
// so a snapshot is a projection of these records, never a separate model. Device-local fields that must
// never reach a snapshot (wrong forms, the parent PIN/hash) are deliberately absent from this state.

export type Subject = 'chinese' | 'english' | 'mathematics' | 'science'
export type Course =
  | 'p2_chinese' | 'p2_higher_chinese' | 'p3_chinese' | 'p3_higher_chinese'
  | 'p2_english' | 'p3_english' | 'p2_mathematics' | 'p3_science'
/** `p3_mathematics` is a catalogue course identity only; it is locked in the Pilot. */
export type AnyCourse = Course | 'p3_mathematics'

export type Stage = 'acquisition' | 'exact' | 'similar' | 'generic' | 'delayed_review'
export type RepairStage = 'exact' | 'similar' | 'generic'
export type Role = 'material_question' | 'repair' | 'delayed_review' | 'general_practice' | 'acquisition_test' | 'replacement'
export type SlotRole = Role | 'teaching'
export type FormatClass = 'high_option' | 'low_option'
export type Phase = 'first' | 'retry' | 'correction'
export type Assistance = 'none' | 'hint' | 'worked_steps' | 'answer_and_explanation'
export type ResponseKind = 'single' | 'ordered' | 'matching' | 'word_bank'
export type SourceType = 'schoolwork' | 'home_practice' | 'external_assessment' | 'other_reviewed_work' | 'app_practice'
export type TargetKind =
  | 'character' | 'word' | 'language_point' | 'reading_skill' | 'science_concept'
  | 'math_relationship' | 'math_method' | 'vocabulary' | 'grammar'

export interface Response {
  kind: ResponseKind
  option_ids: string[]
  pairs: { left: string; right: string }[]
}

export interface Observation {
  id: string
  source_type: SourceType
  observed_on: string
  recorded_on: string
  /** For app_practice: the originating task id (opaque). */
  instance_ref: string
  batch_ref: string | null
  recurrence: 'first' | 'independent' | 'duplicate'
  invalidated: boolean
}

export interface Target {
  id: string
  subject: Subject
  course: Course
  target_kind: TargetKind
  knowledge_point_ref: string | null
  target_value: string | null
  assessed_skill: string | null
  error_type: string
  mapping_status: 'mapped' | 'pending_content'
  verification: 'verified' | 'uncertain'
  status: 'active' | 'superseded' | 'invalidated'
  verified_at: string | null
  replaces: string | null
  observations: Observation[]
}

export interface Presentation {
  id: string
  task_id: string
  position: number
  item_id: string
  item_version: number
  role: Role
  material_ref: string | null
  target_ref: string | null
  stage: Stage | null
  format_class: FormatClass
  first_response_eligible: boolean
  prior_exposures: number
  novel_context: boolean
  presented_at: string
  status: 'presented' | 'answered' | 'corrected' | 'flagged_replaced' | 'invalidated'
}

export interface AnswerEvent {
  id: string
  presentation_id: string
  local_seq: number
  phase: Phase
  assistance: Assistance
  response: Response
  correct: boolean
  at: string
}

export interface PlanMaterial {
  material_ref: string
  material_version: number
  family: string
  question_count: number
}

export interface PlanSlot {
  position: number
  kind: 'material_question' | 'short' | 'teaching'
  material_ref: string | null
  item_id: string | null
  item_version: number | null
  role: SlotRole
  target_ref: string | null
  stage: Stage | null
  counts_toward_x: boolean
}

export interface Clearance { stage: Stage; cleared_on: string }

export interface TargetAggregate {
  target_ref: string
  route: 'short_only' | 'whole_task'
  starting_stage: Stage
  related_presentation_ids: string[]
  high_option_success_ids: string[]
  low_option_success_ids: string[]
  any_first_wrong: boolean
  clearances: Clearance[]
  outcome: 'pending' | 'advanced' | 'retained'
  final_stage_not_before: string | null
}

export type ActivityState = 'active' | 'paused' | 'backgrounded' | 'idle' | 'closed'

export interface Task {
  id: string
  subject: Subject
  local_date: string
  created_at: string
  finalised_at: string | null
  x: number
  policy_version: string
  content_version: string
  status: 'active' | 'paused' | 'finalised'
  plan: { materials: PlanMaterial[]; slots: PlanSlot[] }
  planned_total: number
  cursor: number
  active_seconds: number
  activity: { state: ActivityState; at: string }[]
  /** Recomputed cache of the per-target aggregation; the events remain the truth. */
  target_aggregates: TargetAggregate[]
}

export interface Completion {
  subject: Subject
  local_date: string
  task_id: string | null
  reason: 'full' | 'shortened_no_eligible_content' | 'zero_eligible' | 'replacements_exhausted'
  answered: number
}

export interface Checkpoint {
  id: string
  task_id: string | null
  kind: 'halfway' | 'completion' | 'combined' | 'exploration'
  local_date: string
  story_seq: number
  state: 'pending' | 'delivered'
  delivered_at: string | null
}

export interface StoryState {
  checkpoints: Checkpoint[]
  next_story_seq: number
  chapter: number
  world_flags: string[]
  ended: boolean
}

export interface Flag {
  presentation_id: string | null
  item_id: string
  item_version: number
  reason: 'answer_looks_wrong' | 'question_unclear' | 'too_hard' | 'other'
  flagged_at: string
  status: 'open' | 'restored' | 'disabled'
  decided_at: string | null
}

export interface Suspension {
  item_id: string
  item_version: number | null
  scope: 'child' | 'version'
  since: string
  restored_at: string | null
}

export interface Exposure { item_id: string; first_presented_on: string; last_presented_on: string; times: number }

export interface Settings {
  timezone: string
  timezone_history: { from_timezone: string; timezone: string; changed_at: string }[]
  ui_language: 'zh' | 'en'
  subjects: { subject: Subject; x: number; changed_at: string | null }[]
}

export interface CalendarGuards {
  last_finalised_date: string | null
  last_timezone_change_at: string | null
  max_local_date_seen: string | null
}

export interface Amendment {
  id: string
  at: string
  actor: 'parent'
  kind: 'amend_target' | 'invalidate_target' | 'invalidate_observation' | 'invalidate_presentation' | 'restore_item' | 'disable_item'
  refs: string[]
  replacement_ref: string | null
  reason: 'wrong_target' | 'wrong_skill' | 'wrong_error_type' | 'wrong_date' | 'duplicate' | 'question_problem' | 'not_a_mistake'
  reducer_revision: number
}

export interface ContentVersion { subject: Subject; catalogue_version: string; manifest_version: string | null }

/** The complete recoverable learner state held by the engine (one child). */
export interface EngineState {
  content_versions: ContentVersion[]
  settings: Settings
  targets: Target[]
  presentations: Presentation[]
  events: AnswerEvent[]
  tasks: Task[]
  completions: Completion[]
  rest_days: string[]
  story: StoryState
  flags: Flag[]
  suspensions: Suspension[]
  amendments: Amendment[]
  exposure: Exposure[]
  calendar_guards: CalendarGuards
  /** Monotonic local sequence for answer events. */
  next_seq: number
}
