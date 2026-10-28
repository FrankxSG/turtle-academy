// Which subjects a build offers for daily practice: the one release setting that decides subject start/resume,
// daily requirements, exploration unlocking and the parent's X settings. Installing a subject's catalogue never
// makes it required. Records of a disabled subject are kept (history, X, unfinished tasks) and resume when it is
// enabled again.
//
// Set at build time with VITE_PRACTICE_SUBJECTS (validated in vite.config.ts; no runtime or URL override):
//   unset or empty → chinese (the current release: reviewed Chinese only)
//   all            → chinese, science, mathematics, english (development and tests)
//   none           → no subject (practice and exploration stay closed; a rest day still opens exploration)
//   a comma list   → those subjects, e.g. "chinese,mathematics"
import { SUBJECTS as ALL_SUBJECTS } from './engine/policy.ts'
import type { Subject } from './engine/types.ts'

export const RELEASED_SUBJECTS: readonly Subject[] = ['chinese']

/** Parse the build setting. Unknown or repeated names are rejected so a typo cannot silently drop a subject. */
export function parsePracticeSubjects(raw: string | undefined): Subject[] {
  const value = (raw ?? '').trim().toLowerCase()
  if (value === '') return [...RELEASED_SUBJECTS]
  if (value === 'all') return [...ALL_SUBJECTS]
  if (value === 'none') return []
  const names = value.split(',').map((s) => s.trim())
  const seen = new Set<string>()
  for (const n of names) {
    if (!(ALL_SUBJECTS as readonly string[]).includes(n)) throw new Error(`VITE_PRACTICE_SUBJECTS: unknown subject "${n}"`)
    if (seen.has(n)) throw new Error(`VITE_PRACTICE_SUBJECTS: "${n}" listed twice`)
    seen.add(n)
  }
  return ALL_SUBJECTS.filter((s) => seen.has(s))
}
