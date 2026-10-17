// The pre-Pilot guest sample checkpoint (database `turtle-academy-guest-v1`).
// Issue #17 AC1: it is preserved and kept separate. It is never assigned to the child, never used to infer
// stage or mastery, never included in snapshots, and never modified or deleted by the Pilot upgrade.
// The Pilot store only records that it was seen, so a later deliberate, parent-reviewed selective migration
// (long-term scope) can offer it. No such import exists in the Pilot.

export type LegacyStatus = 'absent' | 'guest_sample' | 'unrecognised' | 'unreadable'

export interface LegacyMarker {
  status: LegacyStatus
  /** First time this device's Pilot store saw the legacy data. */
  first_seen_at: string
  /** Never true in the Pilot: no automatic or implicit migration. */
  migrated: false
}

/** Classify a raw legacy record without trusting or altering it. */
export function classifyLegacy(raw: unknown): Exclude<LegacyStatus, 'unreadable'> {
  if (raw === undefined || raw === null) return 'absent'
  if (typeof raw !== 'object' || Array.isArray(raw)) return 'unrecognised'
  const v = raw as Record<string, unknown>
  const ok = v.id === 'sample' && v.schemaVersion === 1 && Number.isSafeInteger(v.attempts) && (v.attempts as number) >= 0
    && (v.lastAnswer === null || v.lastAnswer === 'turtle' || v.lastAnswer === 'stone' || v.lastAnswer === 'chair')
    && Object.keys(v).every((k) => ['id', 'schemaVersion', 'attempts', 'lastAnswer'].includes(k))
  return ok ? 'guest_sample' : 'unrecognised'
}

export interface LegacyReader {
  /** Read-only access to the legacy guest checkpoint. Implementations must never write. */
  readSample(): Promise<unknown>
}

export interface MarkerStore {
  getMarker(): Promise<LegacyMarker | undefined>
  /** Must be atomic: a failed write leaves no partial marker. */
  putMarker(m: LegacyMarker): Promise<void>
}

/**
 * Run on every Pilot startup. Idempotent: an existing marker is kept (first_seen_at never moves), an
 * interrupted earlier run simply repeats, and corrupt or unknown legacy data is only labelled.
 */
export async function inspectLegacy(reader: LegacyReader, markers: MarkerStore, now: string): Promise<LegacyMarker> {
  const existing = await markers.getMarker()
  let status: LegacyStatus
  try {
    status = classifyLegacy(await reader.readSample())
  } catch {
    status = 'unreadable'
  }
  if (existing && existing.status === status) return existing
  const marker: LegacyMarker = { status, first_seen_at: existing?.first_seen_at ?? now, migrated: false }
  await markers.putMarker(marker)
  return marker
}
