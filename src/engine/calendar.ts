// Calendar rules: profile-timezone learning dates with guards against timezone changes.
// Confirmed behaviour (Functional Design §2): a timezone change must not create extra
// learning days, duplicate completion/story credit, or bring eligibility or reviews forward.
// The algorithm below is an engineering proposal implementing that behaviour.
import type { CalendarGuards, Settings } from './types.ts'

const formatters = new Map<string, Intl.DateTimeFormat>()

/** Calendar date (YYYY-MM-DD) of an instant in an IANA timezone. */
export function localDate(at: string | Date, timezone: string): string {
  let f = formatters.get(timezone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
    formatters.set(timezone, f)
  }
  const parts = f.formatToParts(typeof at === 'string' ? new Date(at) : at)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

export const maxDate = (a: string | null, b: string | null): string | null =>
  a === null ? b : b === null ? a : (a > b ? a : b)

/** Hold-back window after a timezone change, during which the older zone's date also bounds the day. */
const CHANGE_WINDOW_MS = 24 * 3600 * 1000

/** The profile timezone in effect at an instant, from the recorded change history. */
export function timezoneAt(at: string, settings: Settings): string {
  const t = Date.parse(at)
  const history = settings.timezone_history
  if (history.length === 0) return settings.timezone
  let tz = history[0].from_timezone
  for (const change of history) if (Date.parse(change.changed_at) <= t) tz = change.timezone
  return tz
}

/**
 * Raw learning date for an instant, before the never-backwards guard.
 * - Normally the calendar date in the timezone in effect at that instant.
 * - For 24 hours after a timezone change, the earlier of the old- and new-zone dates, so moving east
 *   never starts a new learning day early.
 */
export function rawLearningDate(at: string, settings: Settings): string {
  const t = Date.parse(at)
  let d = localDate(at, timezoneAt(at, settings))
  for (const change of settings.timezone_history) {
    const c = Date.parse(change.changed_at)
    if (t >= c && t - c < CHANGE_WINDOW_MS) {
      const old = localDate(at, change.from_timezone)
      if (old < d) d = old
    }
  }
  return d
}

/** Learning date "now": never earlier than a learning date already seen, so moving west never repeats a day. */
export function learningDate(at: string, settings: Settings, guards: CalendarGuards): string {
  const d = rawLearningDate(at, settings)
  return guards.max_local_date_seen !== null && d < guards.max_local_date_seen ? guards.max_local_date_seen : d
}

/**
 * Learning dates for recorded instants, replayed in time order with a running maximum.
 * Replaying history this way gives the same dates on every device and after every restore,
 * independent of the guard's current value.
 */
export class DateBook {
  private readonly dates = new Map<string, string>()
  constructor(settings: Settings, instants: Iterable<string>) {
    const sorted = [...new Set(instants)].sort((a, b) => Date.parse(a) - Date.parse(b))
    let max = ''
    for (const at of sorted) {
      const d = rawLearningDate(at, settings)
      if (d > max) max = d
      this.dates.set(at, max)
    }
  }
  of(at: string): string {
    const d = this.dates.get(at)
    if (d === undefined) throw new Error('instant not recorded')
    return d
  }
}
