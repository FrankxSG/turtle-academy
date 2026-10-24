// Upload allow-list serializers and their inverse (sync contract: docs/PILOT_LEARNING_ENGINE_SPEC.md §6).
//
// Engine records → sync changes. Each serializer copies only the fields the closed `pilot-sync/1` descriptor allows,
// so a field added to a local record later is not uploaded by accident. Device-only records (`meta`: the local
// event counter) produce no change. Derived values (stages, due dates, unlocks, task aggregates) are never sent.
//
// Settings and story are stored locally as one record each but synced at a finer grain: each editable setting is
// its own change (so a later edit to one field never re-stamps another), timezone history entries are add-only,
// and each story checkpoint is its own forward-only record.
import type { Put, Table } from '../engine/persistence.ts'
import type {
  Amendment, AnswerEvent, CalendarGuards, Checkpoint, Completion, ContentVersion, EngineState, Exposure, Flag, Presentation,
  Settings, StoryState, Subject, Suspension, Target, Task,
} from '../engine/types.ts'
import type { Change, SyncKind } from './validate.ts'
import { keyFor } from './validate.ts'

type Obj = Record<string, unknown>
const pick = <T extends Obj>(v: T, keys: readonly (keyof T)[]): Obj => {
  const out: Obj = {}
  for (const k of keys) if (Object.hasOwn(v, k)) out[k as string] = structuredClone(v[k])
  return out
}

const F = {
  event: ['id', 'presentation_id', 'local_seq', 'phase', 'assistance', 'response', 'correct', 'at'] as (keyof AnswerEvent)[],
  presentation: ['id', 'task_id', 'position', 'item_id', 'item_version', 'role', 'material_ref', 'target_ref', 'stage', 'format_class',
    'first_response_eligible', 'prior_exposures', 'novel_context', 'presented_at', 'status'] as (keyof Presentation)[],
  task: ['id', 'subject', 'local_date', 'created_at', 'finalised_at', 'x', 'policy_version', 'content_version', 'status', 'plan',
    'planned_total', 'cursor', 'active_seconds', 'activity'] as (keyof Task)[],
  completion: ['subject', 'local_date', 'task_id', 'reason', 'answered'] as (keyof Completion)[],
  checkpoint: ['id', 'task_id', 'kind', 'local_date', 'story_seq', 'state', 'delivered_at'] as (keyof Checkpoint)[],
  target: ['id', 'subject', 'course', 'target_kind', 'knowledge_point_ref', 'target_value', 'assessed_skill', 'error_type',
    'mapping_status', 'verification', 'status', 'verified_at', 'replaces', 'observations'] as (keyof Target)[],
  observation: ['id', 'source_type', 'observed_on', 'recorded_on', 'instance_ref', 'batch_ref', 'recurrence', 'invalidated'],
  amendment: ['id', 'at', 'actor', 'kind', 'refs', 'replacement_ref', 'reason', 'reducer_revision'] as (keyof Amendment)[],
  flag: ['presentation_id', 'item_id', 'item_version', 'reason', 'flagged_at', 'status', 'decided_at'] as (keyof Flag)[],
  suspension: ['item_id', 'item_version', 'scope', 'since', 'restored_at'] as (keyof Suspension)[],
  exposure: ['item_id', 'first_presented_on', 'last_presented_on', 'times'] as (keyof Exposure)[],
  guards: ['last_finalised_date', 'last_timezone_change_at', 'max_local_date_seen'] as (keyof CalendarGuards)[],
  content_version: ['subject', 'catalogue_version', 'manifest_version'] as (keyof ContentVersion)[],
}

const change = (kind: SyncKind, value: Obj): Change => ({ kind, key: keyFor(kind, value) as string, value })

const target = (t: Target): Obj => {
  const v = pick(t as unknown as Obj, F.target)
  v.observations = t.observations.map((o) => pick(o as unknown as Obj, F.observation))
  return v
}

/** Kind order: referenced records first, so a large backfill split into several operations stays valid. */
export const KIND_ORDER: SyncKind[] = [
  'task', 'presentation', 'answer_event', 'completion', 'checkpoint', 'story_state', 'target', 'amendment', 'flag', 'suspension',
  'exposure', 'rest_day', 'setting', 'timezone_change', 'guards', 'content_version', 'pack_version', 'active_pack', 'case_link',
  'production_event',
]
export const sortChanges = (cs: Change[]) =>
  [...cs].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))

function settingChanges(prev: Settings | undefined, next: Settings): Change[] {
  const out: Change[] = []
  if (prev?.timezone !== next.timezone) out.push({ kind: 'setting', key: 'timezone', value: { timezone: next.timezone } })
  if (prev?.ui_language !== next.ui_language) out.push({ kind: 'setting', key: 'ui_language', value: { ui_language: next.ui_language } })
  for (const s of next.subjects) {
    const before = prev?.subjects.find((p) => p.subject === s.subject)
    if (!before || before.x !== s.x || before.changed_at !== s.changed_at)
      out.push({ kind: 'setting', key: `x:${s.subject}`, value: { x: s.x, changed_at: s.changed_at } })
  }
  const known = new Set(prev?.timezone_history.map((h) => h.changed_at) ?? [])
  for (const h of next.timezone_history) {
    if (!known.has(h.changed_at)) out.push(change('timezone_change', { from_timezone: h.from_timezone, timezone: h.timezone, changed_at: h.changed_at }))
  }
  return out
}

function storyChanges(prev: StoryState | undefined, next: StoryState): Change[] {
  const out: Change[] = []
  const before = new Map((prev?.checkpoints ?? []).map((c) => [c.id, JSON.stringify(c)]))
  for (const c of next.checkpoints) {
    if (before.get(c.id) !== JSON.stringify(c)) out.push(change('checkpoint', pick(c as unknown as Obj, F.checkpoint)))
  }
  const meta = (s: StoryState | undefined) => s && JSON.stringify([s.next_story_seq, s.chapter, s.world_flags, s.ended])
  if (meta(prev) !== meta(next)) {
    out.push({ kind: 'story_state', key: 'story', value: { next_story_seq: next.next_story_seq, chapter: next.chapter, world_flags: [...next.world_flags], ended: next.ended } })
  }
  return out
}

/** One local engine record → its sync changes. `previous` is the stored value before this write (settings/story). */
export function recordChanges(p: Put, previous?: unknown): Change[] {
  const v = p.value as Obj
  switch (p.table) {
    case 'settings': return settingChanges(previous as Settings | undefined, p.value as Settings)
    case 'story': return storyChanges(previous as StoryState | undefined, p.value as StoryState)
    case 'meta': return [] // device-only
    case 'guards': return [{ kind: 'guards', key: 'guards', value: pick(v, F.guards as string[]) }]
    case 'content_versions': return [change('content_version', pick(v, F.content_version as string[]))]
    case 'targets': return [change('target', target(p.value as Target))]
    case 'presentations': return [change('presentation', pick(v, F.presentation as string[]))]
    case 'tasks': return [change('task', { ...pick(v, F.task as string[]), target_aggregates: [] })]
    case 'completions': return [change('completion', pick(v, F.completion as string[]))]
    case 'rest_days': return [{ kind: 'rest_day', key: String(p.value), value: { date: String(p.value) } }]
    case 'flags': return [change('flag', pick(v, F.flag as string[]))]
    case 'suspensions': return [change('suspension', pick(v, F.suspension as string[]))]
    case 'amendments': return [change('amendment', pick(v, F.amendment as string[]))]
    case 'exposure': return [change('exposure', pick(v, F.exposure as string[]))]
    default: {
      const never: never = p.table
      throw new Error(`unmapped_table:${String(never)}`)
    }
  }
}

export const eventChange = (e: AnswerEvent): Change => change('answer_event', pick(e as unknown as Obj, F.event))

/** Every change for a whole engine state (first-sync backfill). */
export function stateChanges(records: Put[], events: AnswerEvent[]): Change[] {
  return sortChanges([...records.flatMap((p) => recordChanges(p)), ...events.map(eventChange)])
}

// ---------------------------------------------------------------------------------------------------------------
// Downloaded records → local engine records. Records arrive already merged by the server.

export interface RemoteRecord { kind: SyncKind; key: string; value: Obj | null; deleted: boolean }

const TABLE: Partial<Record<SyncKind, Table>> = {
  presentation: 'presentations', task: 'tasks', completion: 'completions', target: 'targets', amendment: 'amendments',
  flag: 'flags', suspension: 'suspensions', exposure: 'exposure', content_version: 'content_versions', guards: 'guards',
}
const ENGINE_KINDS = new Set<SyncKind>([
  'answer_event', 'presentation', 'task', 'completion', 'checkpoint', 'story_state', 'target', 'amendment', 'flag', 'suspension',
  'exposure', 'rest_day', 'setting', 'timezone_change', 'guards', 'content_version',
])
export const isEngineKind = (k: SyncKind) => ENGINE_KINDS.has(k)

/**
 * Fold downloaded engine records into local records. `current` gives the local settings and story records (or the
 * defaults for an empty store). Returns the puts and events to save; unknown or deleted records are skipped.
 */
export function toLocal(remote: RemoteRecord[], current: { settings: Settings; story: StoryState }): { puts: Put[]; events: AnswerEvent[]; deletes: Put[] } {
  const puts: Put[] = []
  const deletes: Put[] = []
  const events: AnswerEvent[] = []
  const settings = structuredClone(current.settings)
  const story = structuredClone(current.story)
  let settingsChanged = false
  let storyChanged = false
  for (const r of remote) {
    if (!isEngineKind(r.kind)) continue
    if (r.deleted || r.value === null) {
      if (r.kind === 'rest_day') deletes.push({ table: 'rest_days', key: r.key, value: null })
      continue
    }
    const v = structuredClone(r.value)
    switch (r.kind) {
      case 'answer_event': events.push(v as unknown as AnswerEvent); break
      case 'rest_day': puts.push({ table: 'rest_days', key: r.key, value: String(v.date) }); break
      case 'checkpoint': {
        const i = story.checkpoints.findIndex((c) => c.id === r.key)
        if (i >= 0) story.checkpoints[i] = v as unknown as Checkpoint
        else story.checkpoints.push(v as unknown as Checkpoint)
        storyChanged = true
        break
      }
      case 'story_state': Object.assign(story, v); storyChanged = true; break
      case 'timezone_change':
        if (!settings.timezone_history.some((h) => h.changed_at === r.key)) settings.timezone_history.push(v as unknown as Settings['timezone_history'][number])
        settingsChanged = true
        break
      case 'setting': {
        if (r.key === 'timezone') settings.timezone = String(v.timezone)
        else if (r.key === 'ui_language') settings.ui_language = v.ui_language as Settings['ui_language']
        else {
          const subject = r.key.slice(2) as Subject
          const entry = settings.subjects.find((s) => s.subject === subject)
          if (entry) { entry.x = Number(v.x); entry.changed_at = (v.changed_at as string | null) ?? null }
          else settings.subjects.push({ subject, x: Number(v.x), changed_at: (v.changed_at as string | null) ?? null })
        }
        settingsChanged = true
        break
      }
      case 'task': puts.push({ table: 'tasks', key: r.key, value: { ...v, target_aggregates: [] } }); break
      default: puts.push({ table: TABLE[r.kind] as Table, key: r.key, value: v })
    }
  }
  if (settingsChanged) {
    settings.timezone_history.sort((a, b) => a.changed_at.localeCompare(b.changed_at))
    puts.push({ table: 'settings', key: 'settings', value: settings })
  }
  if (storyChanged) {
    story.checkpoints.sort((a, b) => a.story_seq - b.story_seq)
    puts.push({ table: 'story', key: 'story', value: story })
  }
  return { puts, events, deletes }
}

/** The empty-store defaults that downloaded settings and story fold into. */
export function defaults(state: EngineState) {
  return { settings: state.settings, story: state.story }
}
