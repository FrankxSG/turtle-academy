// Client-side contract tests for Issue #16. Run with Node 22's built-in runner (no dependencies):
//   node --experimental-strip-types --test supabase/tests/client/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as auth from '../../../src/auth/client.ts'
import { validateSnapshot, SNAPSHOT_SCHEMA_VERSION } from '../../../src/snapshot/validate.ts'

const fixtures = new URL('../fixtures/', import.meta.url)
const valid = JSON.parse(readFileSync(new URL('snapshot-valid.json', fixtures), 'utf8'))
const { cases } = JSON.parse(readFileSync(new URL('snapshot-invalid.json', fixtures), 'utf8'))
const CHILD = '0b9f6c1e-3d2a-4c8b-9e7f-1a2b3c4d5e6f'

function withChild(doc) {
  return { ...structuredClone(doc), child_ref: CHILD }
}

function applyCase(base, c) {
  const doc = structuredClone(base)
  const path = [...c.path]
  const last = path.pop()
  let node = doc
  for (const key of path) node = node[key]
  if (c.op === 'delete') delete node[last]
  else node[last] = c.value
  return doc
}

test('valid synthetic snapshot passes the client validator', () => {
  assert.equal(SNAPSHOT_SCHEMA_VERSION, 'pilot-snapshot/1')
  assert.deepEqual(validateSnapshot(withChild(valid), CHILD), { ok: true })
})

test('every shared invalid case is rejected by the client validator, as on the server', () => {
  for (const c of cases) {
    const result = validateSnapshot(applyCase(withChild(valid), c), CHILD)
    assert.deepEqual(result, { ok: false, reason: 'invalid_snapshot' }, c.name)
  }
})

test('snapshot naming another child is rejected', () => {
  assert.deepEqual(validateSnapshot(withChild(valid), '00000000-0000-4000-8000-000000000001'), { ok: false, reason: 'child_mismatch' })
})

test('oversized snapshot is rejected before structural checks', () => {
  const big = withChild(valid)
  big.exposure = Array.from({ length: 20000 }, (_, n) => ({ item_id: `item-${n}-${'x'.repeat(40)}`, last_presented_on: '2026-10-13', times: 1 }))
  assert.deepEqual(validateSnapshot(big, CHILD), { ok: false, reason: 'too_large' })
})

test('auth module has no sign-up, anonymous or Google sign-in path', () => {
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'public-anon' }, { fetch: async () => { throw new Error('no network') }, storage: null })
  const callables = [...Object.entries(auth), ...Object.entries(client)].filter(([, v]) => typeof v === 'function').map(([k]) => k)
  const names = callables.join(' ').toLowerCase()
  for (const banned of ['signup', 'sign_up', 'anonymous', 'oauth', 'google', 'otp', 'magiclink', 'idtoken']) {
    assert.ok(!names.includes(banned), banned)
  }
  assert.equal(auth.GOOGLE_LOGIN_ENABLED, false)
})

test('config accepts https or local http only, never a missing key', () => {
  assert.equal(auth.readAuthConfig({}), null)
  assert.equal(auth.readAuthConfig({ VITE_SUPABASE_URL: 'http://example.invalid', VITE_SUPABASE_ANON_KEY: 'k' }), null)
  assert.deepEqual(auth.readAuthConfig({ VITE_SUPABASE_URL: 'https://example.invalid/', VITE_SUPABASE_ANON_KEY: 'k' }), { url: 'https://example.invalid', anonKey: 'k' })
  assert.deepEqual(auth.readAuthConfig({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'k' }), { url: 'http://127.0.0.1:54321', anonKey: 'k' })
})

function memoryStore() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m }
}

test('password sign-in posts to the token endpoint and stores the session', async () => {
  const calls = []
  const store = memoryStore()
  const fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_at: 2000000000, user: { id: 'u-1' } }), { status: 200 })
  }
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'public-anon' }, { fetch, storage: store })
  const result = await client.signInWithPassword(' parent@example.invalid ', 'synthetic-password')
  assert.deepEqual(result, { ok: true, session: { accessToken: 'a', refreshToken: 'r', expiresAt: 2000000000, userId: 'u-1' } })
  assert.equal(calls[0].url, 'https://example.invalid/auth/v1/token?grant_type=password')
  assert.equal(calls[0].init.headers.apikey, 'public-anon')
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: 'parent@example.invalid', password: 'synthetic-password' })
  assert.deepEqual(client.getStoredSession(), result.session)
})

test('sign-in errors are mapped to codes without echoing server text', async () => {
  const respond = (status) => async () => new Response(JSON.stringify({ msg: 'server detail' }), { status })
  const make = (fetch) => auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k' }, { fetch, storage: memoryStore() })
  assert.deepEqual(await make(respond(400)).signInWithPassword('p@example.invalid', 'x'), { ok: false, error: 'invalid_credentials' })
  assert.deepEqual(await make(respond(429)).signInWithPassword('p@example.invalid', 'x'), { ok: false, error: 'rate_limited' })
  assert.deepEqual(await make(respond(503)).signInWithPassword('p@example.invalid', 'x'), { ok: false, error: 'unavailable' })
  assert.deepEqual(await make(async () => { throw new TypeError('offline') }).signInWithPassword('p@example.invalid', 'x'), { ok: false, error: 'network' })
  assert.deepEqual(await auth.createAuthClient(null, { storage: null }).signInWithPassword('p@example.invalid', 'x'), { ok: false, error: 'not_configured' })
})

test('expired session is kept for the caller; sign-out clears it even offline', async () => {
  const store = memoryStore()
  store.setItem(auth.SESSION_KEY, JSON.stringify({ accessToken: 'a', refreshToken: 'r', expiresAt: 1000, userId: 'u-1' }))
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k' }, {
    fetch: async () => { throw new TypeError('offline') }, storage: store, now: () => 5_000_000,
  })
  const s = client.getStoredSession()
  assert.ok(s)
  assert.equal(client.isExpired(s), true)
  assert.deepEqual(await client.refreshSession(), { ok: false, error: 'network' })
  assert.ok(client.getStoredSession(), 'a failed refresh must not wipe the stored session')
  await client.signOut()
  assert.equal(client.getStoredSession(), null)
})
