// Defined only by vite.config.ts; no runtime or URL override.
declare const __PRIVATE_PACK_ENABLED__: boolean
// Enabled practice subjects for this build (src/practice-subjects.ts), from VITE_PRACTICE_SUBJECTS at build time.
declare const __PRACTICE_SUBJECTS__: readonly import('./engine/types.ts').Subject[]
// The Chinese course this build serves (src/chinese-course.ts), from VITE_CHINESE_COURSE at build time.
declare const __CHINESE_COURSE__: import('./chinese-course.ts').ChineseCourse
