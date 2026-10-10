import Dexie, { type EntityTable, liveQuery } from 'dexie'

export type SampleAnswer = 'turtle' | 'stone' | 'chair'
export interface GuestCheckpoint {
  id: 'sample'
  schemaVersion: 1
  attempts: number
  lastAnswer: SampleAnswer | null
}
const db = new Dexie('turtle-academy-guest-v1') as Dexie & {
  checkpoints: EntityTable<GuestCheckpoint, 'id'>
}
db.version(1).stores({ checkpoints: 'id' })

const emptyCheckpoint = (): GuestCheckpoint => ({
  id: 'sample', schemaVersion: 1, attempts: 0, lastAnswer: null,
})
function validate(value: GuestCheckpoint | undefined): GuestCheckpoint {
  if (!value) return emptyCheckpoint()
  if (value.schemaVersion !== 1 || value.id !== 'sample'
    || !Number.isSafeInteger(value.attempts) || value.attempts < 0
    || ![null, 'turtle', 'stone', 'chair'].includes(value.lastAnswer)) {
    // Preserve unfamiliar records instead of overwriting them.
    throw new Error('Unsupported guest checkpoint')
  }
  return value
}
export function observeCheckpoint() {
  return liveQuery(async () => validate(await db.checkpoints.get('sample')))
}
export async function saveSampleAnswer(answer: SampleAnswer) {
  // Atomic read/write also prevents lost increments from a second tab.
  await db.transaction('rw', db.checkpoints, async () => {
    const previous = validate(await db.checkpoints.get('sample'))
    await db.checkpoints.put({ ...previous, attempts: previous.attempts + 1, lastAnswer: answer })
  })
}

export async function openGuestStorage() {
  // liveQuery does not emit errors when IndexedDB is missing; open explicitly first.
  await db.open()
}
