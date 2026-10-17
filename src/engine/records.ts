// Mapping between the engine state and keyed local records.
import { X_DEFAULT } from './policy.ts'
import type { Put, StoredRecords, Table } from './persistence.ts'
import type { EngineState, Subject } from './types.ts'

export function emptyState(timezone: string, subjects: readonly Subject[], uiLanguage: 'zh' | 'en' = 'en'): EngineState {
  return {
    content_versions: [],
    settings: {
      timezone, timezone_history: [], ui_language: uiLanguage,
      subjects: subjects.map((subject) => ({ subject, x: X_DEFAULT, changed_at: null })),
    },
    targets: [], presentations: [], events: [], tasks: [], completions: [], rest_days: [],
    story: { checkpoints: [], next_story_seq: 0, chapter: 0, world_flags: [], ended: false },
    flags: [], suspensions: [], amendments: [], exposure: [],
    calendar_guards: { last_finalised_date: null, last_timezone_change_at: null, max_local_date_seen: null },
    next_seq: 0,
  }
}

/** Every record of the state with its table and key (events are handled separately as add-only). */
export function toRecords(s: EngineState): Put[] {
  const out: Put[] = []
  const add = (table: Table, key: string, value: unknown) => out.push({ table, key, value })
  add('settings', 'settings', s.settings)
  add('story', 'story', s.story)
  add('guards', 'guards', s.calendar_guards)
  add('meta', 'next_seq', s.next_seq)
  for (const v of s.content_versions) add('content_versions', v.subject, v)
  for (const t of s.targets) add('targets', t.id, t)
  for (const p of s.presentations) add('presentations', p.id, p)
  for (const t of s.tasks) add('tasks', t.id, t)
  for (const c of s.completions) add('completions', `${c.subject}:${c.task_id ?? c.local_date}`, c)
  for (const d of s.rest_days) add('rest_days', d, d)
  for (const f of s.flags) add('flags', `${f.item_id}@${f.item_version}:${f.presentation_id ?? f.flagged_at}`, f)
  for (const x of s.suspensions) add('suspensions', `${x.item_id}@${x.item_version ?? '*'}`, x)
  for (const a of s.amendments) add('amendments', a.id, a)
  for (const e of s.exposure) add('exposure', e.item_id, e)
  return out
}

export function fromRecords(stored: StoredRecords, fallback: EngineState): EngineState {
  const s = structuredClone(fallback)
  const lists: Partial<Record<Table, unknown[]>> = {}
  for (const r of stored.records) {
    switch (r.table) {
      case 'settings': s.settings = r.value as EngineState['settings']; break
      case 'story': s.story = r.value as EngineState['story']; break
      case 'guards': s.calendar_guards = r.value as EngineState['calendar_guards']; break
      case 'meta': if (r.key === 'next_seq') s.next_seq = r.value as number; break
      default: (lists[r.table] ??= []).push(r.value)
    }
  }
  s.content_versions = (lists.content_versions ?? []) as EngineState['content_versions']
  s.targets = (lists.targets ?? []) as EngineState['targets']
  s.presentations = ((lists.presentations ?? []) as EngineState['presentations']).sort((a, b) => a.presented_at.localeCompare(b.presented_at) || a.position - b.position)
  s.tasks = ((lists.tasks ?? []) as EngineState['tasks']).sort((a, b) => a.created_at.localeCompare(b.created_at))
  s.completions = (lists.completions ?? []) as EngineState['completions']
  s.rest_days = ((lists.rest_days ?? []) as string[]).sort()
  s.flags = (lists.flags ?? []) as EngineState['flags']
  s.suspensions = (lists.suspensions ?? []) as EngineState['suspensions']
  s.amendments = (lists.amendments ?? []) as EngineState['amendments']
  s.exposure = (lists.exposure ?? []) as EngineState['exposure']
  s.events = [...stored.events].sort((a, b) => a.local_seq - b.local_seq)
  const maxSeq = s.events.reduce((m, e) => Math.max(m, e.local_seq + 1), 0)
  if (s.next_seq < maxSeq) s.next_seq = maxSeq
  return s
}
