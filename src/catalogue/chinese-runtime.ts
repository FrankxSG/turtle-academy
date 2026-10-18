// Generic public content can run without opening a private database or loading pack tooling.
import Dexie, { type Table } from 'dexie'
import type { CatalogueRegistry } from './adapter.ts'
import { publicChineseContent } from './chinese-public.ts'
import { installPublicBuilds, type CachedPublicBuild } from './public-install.ts'

export async function openPublicChinese(registry: CatalogueRegistry, pinned: Set<string>) {
  const db = new Dexie('turtle-academy-public-content-v1') as Dexie & { builds: Table<CachedPublicBuild, string> }
  db.version(1).stores({ builds: 'version' })
  try {
    await db.open()
    await installPublicBuilds(registry, {
      all: () => db.builds.toArray(), put: async (b) => { await db.builds.put(b) },
    }, pinned, publicChineseContent())
    return { close: () => db.close() }
  } catch (error) { db.close(); throw error }
}
