import { LearningEngine } from '../engine/engine.ts'
import { WriteQueue } from '../engine/persistence.ts'
import { MistakeProgram } from '../mistakes/program.ts'
import { DexiePrivateStore, startPilotStorage } from '../storage.ts'
import { developmentRegistry, subjects } from './development.ts'

export async function openRuntime(id: string, timezone: string) {
  // One working-copy writer at a time. A second tab must not replay stale task state over the first.
  if (!navigator.locks) throw new Error('device_lock_unavailable')
  let release = () => {}
  let acquired!: (ok: boolean) => void
  const ready = new Promise<boolean>((resolve) => {
    acquired = resolve
  })
  const held = navigator.locks.request(
    `ta-practice-${id}`,
    { ifAvailable: true },
    async (lock) => {
      if (!lock) {
        acquired(false)
        return
      }
      await new Promise<void>((resolve) => {
        release = resolve
        acquired(true)
      })
    },
  )
  if (!(await ready)) {
    await held
    throw new Error('practice_open_in_another_tab')
  }
  try {
    const storage = await startPilotStorage(
      new Date().toISOString(),
      `turtle-academy-synthetic-${id}`,
    )
    const writer = new WriteQueue(storage.store)
    // Private mistake programme records for this identity (packs, crosswalk, production evidence).
    const privateStore = new DexiePrivateStore(`turtle-academy-private-${id}`)
    try {
      await privateStore.open()
      // Chinese uses reviewed content (a separate, offline-cached chunk); other subjects keep the
      // synthetic development fixtures until their content is wired. A test-only build flag keeps the
      // synthetic Chinese fixture for browser tests of task mechanics (material sizes, checkpoints).
      const syntheticChinese = import.meta.env.VITE_SYNTHETIC_CHINESE === '1'
      const registry = developmentRegistry(
        syntheticChinese ? subjects : ['science', 'mathematics', 'english'],
      )
      const now = () => new Date().toISOString()
      const engine = await LearningEngine.load(storage.store, timezone, { registry, writer, now })
      let program: MistakeProgram | null = null
      if (!syntheticChinese) {
        // A Chinese task started on the earlier synthetic fixture still resumes and finishes on it (it stays
        // labelled synthetic); the reviewed release installed next becomes current for new tasks.
        if (engine.state.tasks.some((t) => t.subject === 'chinese' && t.status !== 'finalised' && t.content_version === 'dev-ui-1'))
          developmentRegistry(['chinese'], registry)
        const { publicChineseContent } = await import('../catalogue/chinese-public.ts')
        program = await MistakeProgram.open({ engine, registry, publicContent: publicChineseContent(), store: privateStore, now })
      }
      await engine.flush()
      return {
        engine,
        registry,
        writer,
        program,
        close: () => {
          writer.dispose()
          storage.close()
          privateStore.close()
          release()
        },
      }
    } catch (e) {
      writer.dispose()
      storage.close()
      privateStore.close()
      throw e
    }
  } catch (e) {
    release()
    throw e
  }
}
export type Runtime = Awaited<ReturnType<typeof openRuntime>>
