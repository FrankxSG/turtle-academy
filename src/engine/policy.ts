// Confirmed Pilot rules (Functional Design §2–5, Learning Engine §3–4) as named constants.
import type { AnyCourse, Course, Subject } from './types.ts'

/** Bumped whenever a rule below changes; tasks freeze the version they were planned with. */
export const POLICY_VERSION = 'pilot-policy-1'
export const SNAPSHOT_APP_VERSION = '0.1.0'

export const X_MIN = 6
export const X_MAX = 19
export const X_DEFAULT = 10
/** Owner decision 2026-10-18: in the first pilot Chinese may go up to 20 questions a day. */
export const X_MAX_BY_SUBJECT: Partial<Record<Subject, number>> = { chinese: 20 }
export const xMax = (subject: Subject): number => X_MAX_BY_SUBJECT[subject] ?? X_MAX

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

export function isValidX(x: unknown, subject?: Subject): x is number {
  const max = subject ? xMax(subject) : Math.max(X_MAX, ...Object.values(X_MAX_BY_SUBJECT))
  return typeof x === 'number' && Number.isInteger(x) && x >= X_MIN && x <= max
}

/** Minimum complete materials per language task: ceil(X/5) (6–10 → 2, 11–15 → 3, 16–20 → 4). */
export const minMaterials = (x: number): number => Math.ceil(x / 5)
export const halfwayOf = (total: number): number => Math.ceil(total / 2)

/**
 * Mistake repair in language tasks (owner instruction 2026-10-18: eligible review and mistake repair come before
 * general practice). Whole materials are still required (ceil(X/5)); short review/repair questions for targets
 * no material covers may now be added beyond the materials up to max(X − material questions, ceil(X/2)), so a
 * learner with eligible mistakes always gets some repair without stacking a full extra X. Owner-confirmed
 * 2026-10-18 (about half of a language task for review and repair; due reviews, then repair, then the rest).
 * It replaces the earlier "no short questions once materials reach X" behaviour.
 */
export const languagePrescribedShortMax = (x: number, materialQuestions: number): number =>
  Math.max(x - materialQuestions, Math.ceil(x / 2))

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

/**
 * Controlled error types a parent can choose when correcting an imported mistake (the Chinese import contract,
 * contracts/chinese/1.schema.json). `unknown_cause` is always allowed; types the reviewed content assigns to
 * wrong options of the same knowledge point are also accepted.
 */
export const ERROR_TYPES: Partial<Record<Subject, readonly string[]>> = {
  chinese: ['form_confusion', 'meaning_confusion', 'information_selection', 'sentence_order', 'punctuation', 'unknown_cause'],
}
