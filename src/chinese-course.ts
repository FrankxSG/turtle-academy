// Which Chinese course a build serves: the one release setting read by the public content installer and by the
// private mistake-pack code. The build defaults to Higher Chinese.
//
// Set at build time with VITE_CHINESE_COURSE (validated in vite.config.ts; no runtime or URL override):
//   unset or empty   → higher_chinese
//   higher_chinese   → P2 + P3 Higher Chinese
//   chinese          → P2 + P3 Chinese
export const CHINESE_COURSES = {
  higher_chinese: { pack: 'p2_higher_chinese', courses: ['p2_higher_chinese', 'p3_higher_chinese'] },
  chinese: { pack: 'p2_chinese', courses: ['p2_chinese', 'p3_chinese'] },
} as const satisfies Record<string, { pack: string; courses: readonly string[] }>

export type ChineseCourse = keyof typeof CHINESE_COURSES

export const RELEASED_CHINESE_COURSE: ChineseCourse = 'higher_chinese'

/** Parse the build setting. An unknown name is rejected so a typo cannot silently serve another course. */
export function parseChineseCourse(raw: string | undefined): ChineseCourse {
  const value = (raw ?? '').trim().toLowerCase()
  if (value === '') return RELEASED_CHINESE_COURSE
  if (!Object.hasOwn(CHINESE_COURSES, value)) throw new Error(`VITE_CHINESE_COURSE: unknown course "${value}"`)
  return value as ChineseCourse
}

/** The grade courses practised by a learner whose mistake packs are for `packCourse`. */
export function learnerCourses(packCourse: string): string[] {
  const found = Object.values(CHINESE_COURSES).find((c) => c.pack === packCourse)
  return found ? [...found.courses] : [packCourse]
}
