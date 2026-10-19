// Ask the browser to keep this site's storage instead of clearing it when the device runs low on space.
// Until cloud sync exists the device copy is the only copy, so this is the main protection against silent loss;
// afterwards it still protects offline work not yet synced. Browsers may refuse; the parent is told so, and installing the app to the home screen usually lets the request succeed.
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
