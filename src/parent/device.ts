// Device-only security state. Never added to the engine or its snapshot allow-list.
import type { AuthClient } from '../auth/client.ts'

export const PIN_POLICY = { algorithm: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, saltBytes: 16, bits: 256 } as const
type Device = { id: string; version: 1; salt: string; digest: string; failures: number; blockedUntil: number }
const DB = 'turtle-academy-device-v1'
const hex = (a: ArrayBuffer | Uint8Array) => [...new Uint8Array(a)].map((b) => b.toString(16).padStart(2, '0')).join('')
const unhex = (s: string) => new Uint8Array(s.match(/../g)!.map((b) => parseInt(b, 16)))
export const validPin = (s: string) => /^\d{4,6}$/.test(s)

export async function identityKey(userId: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId)))
}
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore('devices', { keyPath: 'id' })
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(new Error('device_storage_unavailable'))
    r.onblocked = () => reject(new Error('device_storage_unavailable'))
  })
}
async function read(id: string): Promise<Device | null> {
  const db = await database()
  try {
    const row = await new Promise<Device | undefined>((resolve, reject) => {
      const tx = db.transaction('devices', 'readonly')
      const r = tx.objectStore('devices').get(id)
      tx.oncomplete = () => resolve(r.result)
      tx.onabort = tx.onerror = () => reject(new Error('device_storage_unavailable'))
    })
    if (!row) return null
    if (row.version !== 1 || !/^[a-f0-9]{32}$/.test(row.salt) || !/^[a-f0-9]{64}$/.test(row.digest)
      || !Number.isSafeInteger(row.failures) || row.failures < 0 || !Number.isSafeInteger(row.blockedUntil) || row.blockedUntil < 0) {
      throw new Error('device_state_invalid') // Never silently overwrite corrupt protection.
    }
    return row
  } finally { db.close() }
}
async function write(row: Device) {
  const db = await database()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('devices', 'readwrite')
      tx.objectStore('devices').put(row)
      tx.oncomplete = () => resolve()
      tx.onabort = tx.onerror = () => reject(new Error('device_storage_unavailable'))
    })
  } finally { db.close() }
}
async function lock<T>(id: string, work: () => Promise<T>): Promise<T> {
  if (!navigator.locks) throw new Error('device_lock_unavailable')
  return navigator.locks.request(`ta-device-${id}`, work)
}
async function hash(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: PIN_POLICY.hash, salt: unhex(salt), iterations: PIN_POLICY.iterations }, key, PIN_POLICY.bits))
}
async function newRecord(id: string, pin: string): Promise<Device> {
  if (!validPin(pin)) throw new Error('invalid_pin')
  const salt = hex(crypto.getRandomValues(new Uint8Array(PIN_POLICY.saltBytes)))
  return { id, version: 1, salt, digest: await hash(pin, salt), failures: 0, blockedUntil: 0 }
}
export async function isInitialized(id: string) { return (await read(id)) !== null }

/** Only called after this session's successful online password sign-in; an expired stored token is insufficient. */
export async function initializeDevice(id: string, pin: string) {
  return lock(id, async () => {
    if (await read(id)) throw new Error('device_already_initialized')
    await write(await newRecord(id, pin))
  })
}
export async function verifyPin(id: string, pin: string): Promise<{ ok: boolean; waitSeconds: number }> {
  return lock(id, async () => {
    const r = await read(id)
    if (!r) throw new Error('device_not_initialized')
    const now = Date.now()
    if (r.blockedUntil > now) return { ok: false, waitSeconds: Math.ceil((r.blockedUntil - now) / 1000) }
    // Invalid length also consumes an attempt. No PIN value or digest leaves this module.
    const candidate = validPin(pin) ? await hash(pin, r.salt) : ''
    let diff = candidate.length ^ r.digest.length
    for (let i = 0; i < r.digest.length; i++) diff |= (candidate.charCodeAt(i) || 0) ^ r.digest.charCodeAt(i)
    const ok = diff === 0
    r.failures = ok ? 0 : Math.min(r.failures + 1, 1000)
    const seconds = ok ? 0 : Math.min(2 ** Math.min(r.failures - 1, 12), 3600)
    r.blockedUntil = ok ? 0 : Date.now() + seconds * 1000
    await write(r) // Failure fails closed, including a successful verification that cannot be saved.
    return { ok, waitSeconds: seconds }
  })
}
/** Separate non-persistent auth client: a failed/wrong-account reset cannot replace the app identity. */
export async function resetPin(id: string, pin: string, email: string, password: string, auth: AuthClient) {
  if (!navigator.onLine) throw new Error('reset_requires_online_password')
  if (!validPin(pin)) throw new Error('invalid_pin')
  const result = await auth.signInWithPassword(email, password)
  if (!result.ok) throw new Error('reset_requires_online_password')
  try {
    if (await identityKey(result.session.userId) !== id) throw new Error('reset_requires_same_account')
    await lock(id, async () => {
      if (!await read(id)) throw new Error('device_not_initialized')
      await write(await newRecord(id, pin))
    })
  } finally { void auth.signOut() }
}
