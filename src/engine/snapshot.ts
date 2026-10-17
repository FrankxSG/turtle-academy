// Local-only snapshot export (Issue #17 AC4). Produces a `pilot-snapshot/1` document that passes the #16
// validator. Nothing is uploaded here. Device-local data is structurally absent: wrong forms and the parent
// PIN/hash are not part of the engine state, and the legacy guest checkpoint lives in a separate store.
import { SNAPSHOT_SCHEMA_VERSION, validateSnapshot, type SnapshotCheck } from '../snapshot/validate.ts'
import type { Derived } from './evidence.ts'
import { SNAPSHOT_APP_VERSION } from './policy.ts'
import type { EngineState } from './types.ts'

/** The snapshot schema version this engine is pinned to. A schema change must bump both together. */
export const PINNED_SNAPSHOT_SCHEMA = 'pilot-snapshot/1' as const
if (SNAPSHOT_SCHEMA_VERSION !== PINNED_SNAPSHOT_SCHEMA) throw new Error('snapshot schema version mismatch')

export interface PendingUpload { operation_id: string; base_snapshot_id: string | null; queued_at: string }

type Eligibility = { target_ref: string; not_before: string; reason: 'import_next_day' | 'app_target_next_task' | 'failure_cooldown' | 'final_stage_gate' | 'review_due'; source_task_id: string | null }

export function buildSnapshot(state: EngineState, derived: Derived, childRef: string, createdAt: string, pending: PendingUpload | null = null) {
  const eligibility: Eligibility[] = []
  for (const pr of derived.progress.values()) {
    if (pr.blockedByTask !== null) {
      // Bound not yet dated: the blocking task is unfinalised. Its id carries the bound.
      eligibility.push({ target_ref: pr.target.id, not_before: pr.notBefore ?? pr.dueOn ?? '9999-12-31', reason: pr.notBeforeReason ?? 'failure_cooldown', source_task_id: pr.blockedByTask })
    } else if (pr.stage === 'delayed_review' && pr.dueOn !== null) {
      eligibility.push({ target_ref: pr.target.id, not_before: pr.dueOn, reason: 'review_due', source_task_id: null })
    } else if (pr.notBefore !== null) {
      eligibility.push({ target_ref: pr.target.id, not_before: pr.notBefore, reason: pr.notBeforeReason === 'review_due' || pr.notBeforeReason === null ? 'failure_cooldown' : pr.notBeforeReason, source_task_id: null })
    }
  }
  return {
    schema_version: PINNED_SNAPSHOT_SCHEMA,
    child_ref: childRef,
    created_at: createdAt,
    app_version: SNAPSHOT_APP_VERSION,
    content_versions: structuredClone(state.content_versions),
    settings: structuredClone(state.settings),
    targets: structuredClone(state.targets),
    presentations: structuredClone(state.presentations),
    events: structuredClone(state.events),
    tasks: state.tasks.map((t) => ({ ...structuredClone(t), target_aggregates: structuredClone(derived.aggregates.get(t.id) ?? []) })),
    eligibility,
    amendments: structuredClone(state.amendments),
    completions: structuredClone(state.completions),
    rest_days: [...state.rest_days],
    story: structuredClone(state.story),
    flags: structuredClone(state.flags),
    suspensions: structuredClone(state.suspensions),
    exposure: structuredClone(state.exposure),
    calendar_guards: structuredClone(state.calendar_guards),
    pending_upload: pending,
  }
}

export function exportSnapshot(state: EngineState, derived: Derived, childRef: string, createdAt: string, pending: PendingUpload | null = null):
  { snapshot: ReturnType<typeof buildSnapshot>; check: SnapshotCheck } {
  const snapshot = buildSnapshot(state, derived, childRef, createdAt, pending)
  return { snapshot, check: validateSnapshot(snapshot, childRef) }
}
