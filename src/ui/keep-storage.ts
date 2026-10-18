// Ask the browser to keep this site's storage instead of clearing it when the device runs low on space.
// With device-only records (no cloud backup) this is the main protection against silent loss. Browsers may
// refuse; the parent is told so, and installing the app to the home screen usually lets the request succeed.
export type StorageKeep = 'kept' | 'not_kept' | 'unsupported'

interface StorageManagerLike {
  persisted?: () => Promise<boolean>
  persist?: () => Promise<boolean>
}

export async function keepStorage(storage: StorageManagerLike | undefined): Promise<StorageKeep> {
  if (!storage?.persist || !storage.persisted) return 'unsupported'
  try {
    if (await storage.persisted()) return 'kept'
    return (await storage.persist()) ? 'kept' : 'not_kept'
  } catch {
    return 'not_kept'
  }
}
