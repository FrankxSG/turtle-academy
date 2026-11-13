// Only reachable from the explicitly authorised private build. No repository credentials.
import type { LearningEngine } from '../engine/engine.ts'
import type { CatalogueRegistry } from '../catalogue/adapter.ts'
import { CHINESE_COURSES } from '../chinese-course.ts'
import { publicChineseContent } from '../catalogue/chinese-public.ts'
import { DexiePrivateStore } from './storage.ts'
import { MistakeProgram } from './program.ts'

export async function openPrivateProgram(id: string, engine: LearningEngine, registry: CatalogueRegistry, now: () => string) {
  const store = new DexiePrivateStore(`turtle-academy-private-${id}`)
  try {
    await store.open()
    const program = await MistakeProgram.open({ engine, registry, publicContent: publicChineseContent(), store, now,
      course: CHINESE_COURSES[__CHINESE_COURSE__].pack })
    return { program, store, close: () => store.close() }
  } catch (error) { store.close(); throw error }
}
