import { LearningEngine } from '../engine/engine.ts'
import { WriteQueue } from '../engine/persistence.ts'
import { startPilotStorage } from '../storage.ts'
import { developmentRegistry } from './development.ts'

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
    try {
      const registry = developmentRegistry()
      const engine = await LearningEngine.load(storage.store, timezone, {
        registry,
        writer,
        now: () => new Date().toISOString(),
      })
      await engine.flush()
      return {
        engine,
        registry,
        writer,
        close: () => {
          writer.dispose()
          storage.close()
          release()
        },
      }
    } catch (e) {
      writer.dispose()
      storage.close()
      throw e
    }
  } catch (e) {
    release()
    throw e
  }
}
export type Runtime = Awaited<ReturnType<typeof openRuntime>>
