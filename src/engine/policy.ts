// Confirmed Pilot rules (Functional Design §2–5, Learning Engine §3–4) as named constants.
import type { AnyCourse, Course, Subject } from './types.ts'

/** Bumped whenever a rule below changes; tasks freeze the version they were planned with. */
export const POLICY_VERSION = 'pilot-policy-1'
export const SNAPSHOT_APP_VERSION = '0.1.0'

export const X_MIN = 6
export const X_MAX = 19
export const X_DEFAULT = 10

/** Correct delayed-check intervals in days, then every 30 days. */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const
export const MAX_CLEARANCES_PER_TARGET_PER_DAY = 2
/** Science filler/general practice excludes items presented on any of the previous 7 calendar days. */
export const SCIENCE_FILLER_EXCLUSION_DAYS = 7
/** Two or more minutes without interaction stops active-time counting. */
export const IDLE_AFTER_SECONDS = 120

export const SUBJECTS: readonly Subject[] = ['chinese', 'science', 'mathematics', 'english']
export const LANGUAGE_SUBJECTS: readonly Subject[] = ['chinese', 'english']
export const isLanguage = (s: Subject): boolean => LANGUAGE_SUBJECTS.includes(s)

export function isValidX(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= X_MIN && x <= X_MAX
}

/** Minimum complete materials per language task: ceil(X/5) (6–10 → 2, 11–15 → 3, 16–19 → 4). */
export const minMaterials = (x: number): number => Math.ceil(x / 5)
export const halfwayOf = (total: number): number => Math.ceil(total / 2)

/**
 * Course locks (Functional Design §1, Engine §5 course register, F36).
 * - P3 Chinese/Higher Chinese and English general practice: open from the first release.
 * - P3 language mistake imports: deferred (rejected explicitly, not stored as pending content).
 * - P3 Mathematics: locked for practice and import.
 */
const PRACTICE_COURSES: readonly AnyCourse[] = [
  'p2_chinese', 'p2_higher_chinese', 'p3_chinese', 'p3_higher_chinese',
  'p2_english', 'p3_english', 'p2_mathematics', 'p3_science',
]
const IMPORT_COURSES: readonly AnyCourse[] = [
  'p2_chinese', 'p2_higher_chinese', 'p2_english', 'p2_mathematics', 'p3_science',
]

export type CourseAccess = { practice: boolean; import: 'enabled' | 'deferred' | 'locked' }

export function courseAccess(course: AnyCourse): CourseAccess {
  if (course === 'p3_mathematics') return { practice: false, import: 'locked' }
  return {
    practice: PRACTICE_COURSES.includes(course),
    import: IMPORT_COURSES.includes(course) ? 'enabled' : 'deferred',
  }
}

export const isPractisable = (course: AnyCourse): course is Course => courseAccess(course).practice
