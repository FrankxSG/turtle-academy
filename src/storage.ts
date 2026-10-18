import Dexie, { type EntityTable, type Table, liveQuery } from 'dexie'
import type { Mutation, RecordStore, StoredRecords, Put } from './engine/persistence.ts'
import type { AnswerEvent } from './engine/types.ts'
import { inspectLegacy, type LegacyMarker, type LegacyReader, type MarkerStore } from './engine/legacy.ts'
import type { PrivatePack } from './mistakes/pack.ts'
import type { CrosswalkRow } from './mistakes/intake.ts'
import type { ProductionEvent } from './mistakes/production.ts'
import type { PrivateStore, StoredBuild } from './mistakes/program.ts'

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

// ---------------------------------------------------------------------------------------------------
// Pilot learner store (Issue #17). A separate database: the guest database above is never upgraded,
// modified or deleted by the Pilot, and its contents never become child evidence (src/engine/legacy.ts).
// Records are keyed puts; answer events are add-only; every mutation is applied at most once.

export const PILOT_DB_NAME = 'turtle-academy-pilot-v1'

type PilotDb = Dexie & {
  records: Table<Put, [string, string]>
  events: EntityTable<AnswerEvent, 'id'>
  mutations: EntityTable<{ id: string; order: number }, 'id'>
  legacy: EntityTable<LegacyMarker & { id: 'guest' }, 'id'>
}

export function openPilotDb(name = PILOT_DB_NAME): PilotDb {
  const pilot = new Dexie(name) as PilotDb
  pilot.version(1).stores({ records: '[table+key]', events: 'id', mutations: 'id', legacy: 'id' })
  return pilot
}

export class DexieRecordStore implements RecordStore, MarkerStore {
  private readonly pilot: PilotDb
  constructor(pilot: PilotDb) {
    this.pilot = pilot
  }

  async commit(m: Mutation): Promise<void> {
    const { records, events, mutations } = this.pilot
    await this.pilot.transaction('rw', records, events, mutations, async () => {
      if (await mutations.get(m.id)) return
      if (m.puts.length > 0) await records.bulkPut(m.puts)
      for (const e of m.events) {
        const existing = await events.get(e.id)
        if (existing && JSON.stringify(existing) !== JSON.stringify(e)) throw new Error('append-only event conflict')
        if (!existing) await events.add(e)
      }
      await mutations.put({ id: m.id, order: m.order })
    })
  }

  async load(): Promise<StoredRecords> {
    return { records: await this.pilot.records.toArray(), events: await this.pilot.events.toArray() }
  }

  async getMarker(): Promise<LegacyMarker | undefined> {
    const row = await this.pilot.legacy.get('guest')
    if (!row) return undefined
    return { status: row.status, first_seen_at: row.first_seen_at, migrated: false }
  }

  async putMarker(m: LegacyMarker): Promise<void> {
    await this.pilot.legacy.put({ id: 'guest', ...m })
  }
}

export const GUEST_DB_NAME = 'turtle-academy-guest-v1'

/**
 * Read-only view of the legacy guest checkpoint through the native IndexedDB API.
 * It opens without a version, so an existing database is never upgraded; if the database does not exist,
 * the creation is aborted, so inspection never creates it; it only ever starts readonly transactions.
 * A database with an unexpected layout is reported as such and left exactly as it is.
 */
export function makeLegacyGuestReader(name = GUEST_DB_NAME, idb: IDBFactory = indexedDB): LegacyReader {
  return {
    readSample: () => new Promise<unknown>((resolve, reject) => {
      let absent = false
      const req = idb.open(name)
      req.onupgradeneeded = () => {
        absent = true
        req.transaction?.abort()
      }
      req.onerror = (e) => {
        if (absent) {
          e.preventDefault()
          resolve(undefined)
        } else reject(req.error)
      }
      req.onblocked = () => reject(new Error('legacy database blocked'))
      req.onsuccess = () => {
        const legacy = req.result
        const done = (fn: () => void) => { legacy.close(); fn() }
        try {
          if (!legacy.objectStoreNames.contains('checkpoints')) {
            done(() => resolve({ unexpected_layout: true }))
            return
          }
          const get = legacy.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('sample')
          get.onsuccess = () => done(() => resolve(get.result))
          get.onerror = () => done(() => reject(get.error))
        } catch (e) {
          done(() => reject(e))
        }
      }
    }),
  }
}

/** Kept for callers that use the default guest database. */
export const legacyGuestReader: LegacyReader = { readSample: () => makeLegacyGuestReader().readSample() }

/**
 * Pilot startup: open (or create) the learner database and record, once, what legacy guest data exists.
 * Idempotent across restarts; an interrupted run simply repeats on the next start.
 */
export async function startPilotStorage(now: string, name = PILOT_DB_NAME, legacyName = GUEST_DB_NAME) {
  const pilot = openPilotDb(name)
  await pilot.open()
  const store = new DexieRecordStore(pilot)
  const marker = await inspectLegacy(makeLegacyGuestReader(legacyName), store, now)
  return { store, marker, close: () => pilot.close() }
}

// ---------------------------------------------------------------------------------------------------
// Private mistake programme store (src/mistakes). Separate database per identity: packs, crosswalk,
// parent-observed production events and kept content builds. Never part of the engine records or snapshot.

type PrivateDb = Dexie & {
  packs: EntityTable<PrivatePack, 'pack_id'>
  kv: Table<{ key: string; value: unknown }, string>
  production: EntityTable<ProductionEvent, 'id'>
  builds: EntityTable<StoredBuild, 'version'>
}

export class DexiePrivateStore implements PrivateStore {
  private readonly db: PrivateDb
  constructor(name: string) {
    this.db = new Dexie(name) as PrivateDb
    this.db.version(1).stores({ packs: 'pack_id', kv: 'key', production: 'id', builds: 'version' })
  }
  async open() { await this.db.open() }
  close() { this.db.close() }
  async packs() { return this.db.packs.toArray() }
  async putPack(p: PrivatePack) { await this.db.packs.put(p) }
  async crosswalk() { return ((await this.db.kv.get('crosswalk'))?.value as CrosswalkRow[] | undefined) ?? [] }
  async putCrosswalk(rows: CrosswalkRow[]) { await this.db.kv.put({ key: 'crosswalk', value: rows }) }
  async production() { return this.db.production.toArray() }
  async addProduction(e: ProductionEvent) {
    // Add-only: a repeated id (double tap, re-sync) is ignored, never overwritten.
    await this.db.transaction('rw', this.db.production, async () => {
      if (!(await this.db.production.get(e.id))) await this.db.production.add(e)
    })
  }
  async releases() { return this.db.builds.toArray() }
  async putRelease(b: StoredBuild) { await this.db.builds.put(b) }
  async deleteRelease(version: string) { await this.db.builds.delete(version) }
}
