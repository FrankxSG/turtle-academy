import Dexie, { type EntityTable, type Table } from 'dexie'
import type { PrivatePack } from './pack.ts'
import type { CrosswalkRow } from './intake.ts'
import type { ProductionEvent } from './production.ts'
import type { PrivateStore, StoredBuild } from './program.ts'

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
  /** The current pack replaces any earlier one; tasks pinned to earlier content keep it through stored builds. */
  async putPack(p: PrivatePack) {
    await this.db.transaction('rw', this.db.packs, async () => {
      await this.db.packs.clear()
      await this.db.packs.put(p)
    })
  }
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
