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

test('the valid fixture populates every declared field and every array of the contract', () => {
  const schema = JSON.parse(readFileSync(new URL('../../../src/snapshot/schema.json', import.meta.url), 'utf8'))
  const seenKeys = new Set()
  const filledArrays = new Set()
  const walk = (node, value, path) => {
    while (node.$ref) node = schema.defs[node.$ref]
    if (value === null || value === undefined) return
    if (node.type === 'object') {
      for (const [k, child] of Object.entries(node.properties ?? {})) {
        if (k in value) {
          seenKeys.add(`${path}.${k}`)
          walk(child, value[k], `${path}.${k}`)
        }
      }
    } else if (node.type === 'array') {
      if (value.length > 0) filledArrays.add(path)
      for (const v of value) walk(node.items, v, `${path}[]`)
    }
  }
  const declaredKeys = new Set()
  const declaredArrays = new Set()
  const declare = (node, path) => {
    while (node.$ref) node = schema.defs[node.$ref]
    if (node.type === 'object') for (const [k, child] of Object.entries(node.properties ?? {})) { declaredKeys.add(`${path}.${k}`); declare(child, `${path}.${k}`) }
    else if (node.type === 'array') { declaredArrays.add(path); declare(node.items, `${path}[]`) }
  }
  declare(schema.root, '$')
  walk(schema.root, withChild(valid), '$')
  assert.deepEqual([...declaredKeys].filter((k) => !seenKeys.has(k)), [], 'declared fields missing from the fixture')
  assert.deepEqual([...declaredArrays].filter((k) => !filledArrays.has(k) && k !== '$.pending_upload'), [], 'declared arrays never populated in the fixture')
})

test('recoverable engine state is representable and survives a round trip (PR #19 review finding 1)', () => {
  const doc = withChild(valid)
  const back = JSON.parse(JSON.stringify(doc))
  assert.deepEqual(back, doc)
  assert.deepEqual(validateSnapshot(back, CHILD), { ok: true })
  const responses = doc.events.map((e) => e.response)
  // structured ordered and matching responses, not one selected option
  assert.ok(responses.some((r) => r.kind === 'ordered' && r.option_ids.length > 1))
  assert.ok(responses.some((r) => r.kind === 'matching' && r.pairs.length > 1))
  // independent observation history with recurrence versus duplicate
  const recurrences = doc.targets.flatMap((t) => t.observations.map((o) => o.recurrence))
  assert.ok(recurrences.includes('independent') && recurrences.includes('duplicate'))
  assert.ok(doc.targets.every((t) => 'assessed_skill' in t && 'error_type' in t))
  // a paused whole-material task keeps its frozen plan, policy version and an unstarted short slot
  const paused = doc.tasks.find((t) => t.status === 'paused')
  assert.ok(paused.plan.materials.length >= 1 && paused.policy_version && paused.finalised_at === null)
  assert.ok(paused.plan.slots.some((s) => s.kind === 'material_question' && s.item_id))
  assert.ok(paused.plan.slots.some((s) => s.kind === 'short' && s.item_id === null))
  assert.ok(paused.target_aggregates.some((a) => a.route === 'whole_task' && a.related_presentation_ids.length > 1))
  assert.ok(doc.tasks.some((t) => t.finalised_at !== null))
  // presentations carry roles; checkpoints carry delivery state
  assert.ok(new Set(doc.presentations.map((p) => p.role)).size >= 3)
  const states = doc.story.checkpoints.map((c) => c.state)
  assert.ok(states.includes('pending') && states.includes('delivered'))
  assert.ok(doc.amendments.length > 0 && doc.eligibility.length > 0)
})

test('the earlier lossy shape is no longer accepted', () => {
  const doc = withChild(valid)
  doc.events[0] = { ...doc.events[0], selected_option_id: 'opt-1' }
  assert.deepEqual(validateSnapshot(doc, CHILD), { ok: false, reason: 'invalid_snapshot' })
})

test('snapshot naming another child is rejected', () => {
  assert.deepEqual(validateSnapshot(withChild(valid), '00000000-0000-4000-8000-000000000001'), { ok: false, reason: 'child_mismatch' })
})

test('oversized snapshot is rejected before structural checks', () => {
  const big = withChild(valid)
  big.exposure = Array.from({ length: 20000 }, (_, n) => ({ item_id: `item-${n}-${'x'.repeat(40)}`, last_presented_on: '2026-10-13', times: 1 }))
  assert.deepEqual(validateSnapshot(big, CHILD), { ok: false, reason: 'too_large' })
})

test('auth module has no sign-up, anonymous, OTP or magic-link path', () => {
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'public-anon', googleEnabled: false }, { fetch: async () => { throw new Error('no network') }, storage: null })
  const callables = [...Object.entries(auth), ...Object.entries(client)].filter(([, v]) => typeof v === 'function').map(([k]) => k)
  const names = callables.join(' ').toLowerCase()
  for (const banned of ['signup', 'sign_up', 'anonymous', 'otp', 'magiclink', 'idtoken']) {
    assert.ok(!names.includes(banned), banned)
  }
})

test('Google sign-in is off by default and refuses to start or complete', async () => {
  assert.equal(auth.readAuthConfig({ VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_ANON_KEY: 'k' }).googleEnabled, false)
  assert.equal(auth.readAuthConfig({ VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_ANON_KEY: 'k', VITE_GOOGLE_LOGIN: 'true' }).googleEnabled, false)
  assert.equal(auth.readAuthConfig({ VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_ANON_KEY: 'k', VITE_GOOGLE_LOGIN: 'on' }).googleEnabled, true)
  let called = false
  const store = memoryStore()
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k', googleEnabled: false }, { fetch: async () => { called = true }, storage: store })
  assert.deepEqual(await client.startGoogleSignIn('https://app.example.invalid/auth/callback'), { ok: false, error: 'google_disabled' })
  assert.deepEqual(await client.completeGoogleSignIn('https://app.example.invalid/auth/callback?code=c'), { ok: false, error: 'google_disabled' })
  assert.equal(called, false)
  assert.equal(store.m.size, 0)
})

test('Google sign-in, when switched on, uses PKCE and stores the session', async () => {
  const calls = []
  const store = memoryStore()
  const fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ access_token: 'g', refresh_token: 'gr', expires_at: 2000000000, user: { id: 'u-1' } }), { status: 200 })
  }
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k', googleEnabled: true }, { fetch, storage: store })
  const start = await client.startGoogleSignIn('https://app.example.invalid/auth/callback')
  assert.equal(start.ok, true)
  const u = new URL(start.url)
  assert.equal(u.origin + u.pathname, 'https://example.invalid/auth/v1/authorize')
  assert.equal(u.searchParams.get('provider'), 'google')
  assert.equal(u.searchParams.get('code_challenge_method'), 's256')
  const verifier = store.getItem(auth.PKCE_KEY)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  assert.equal(u.searchParams.get('code_challenge'), Buffer.from(digest).toString('base64url'))
  assert.ok(!start.url.includes(verifier), 'the verifier never leaves the device in step 1')

  const done = await client.completeGoogleSignIn('https://app.example.invalid/auth/callback?code=abc')
  assert.deepEqual(done, { ok: true, session: { accessToken: 'g', refreshToken: 'gr', expiresAt: 2000000000, userId: 'u-1' } })
  assert.equal(calls[0].url, 'https://example.invalid/auth/v1/token?grant_type=pkce')
  assert.deepEqual(JSON.parse(calls[0].init.body), { auth_code: 'abc', code_verifier: verifier })
  assert.equal(store.getItem(auth.PKCE_KEY), null, 'verifier is single use')
})

test('Google refusal or cancellation fails closed and clears the verifier', async () => {
  let called = false
  const store = memoryStore()
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k', googleEnabled: true }, { fetch: async () => { called = true }, storage: store })
  assert.deepEqual(await client.startGoogleSignIn('http://evil.example.invalid/cb'), { ok: false, error: 'not_configured' })
  await client.startGoogleSignIn('https://app.example.invalid/cb')
  const refused = await client.completeGoogleSignIn('https://app.example.invalid/cb?error=access_denied&error_code=signup_disabled')
  assert.deepEqual(refused, { ok: false, error: 'google_signup_refused' })
  assert.equal(store.getItem(auth.PKCE_KEY), null)
  // the verifier was consumed, so a replayed code fails without calling the token endpoint
  assert.deepEqual(await client.completeGoogleSignIn('https://app.example.invalid/cb?code=replayed'), { ok: false, error: 'google_failed' })
  assert.equal(called, false)
  assert.equal(client.getStoredSession(), null)
})

test('config accepts https or local http only, never a missing key', () => {
  assert.equal(auth.readAuthConfig({}), null)
  assert.equal(auth.readAuthConfig({ VITE_SUPABASE_URL: 'http://example.invalid', VITE_SUPABASE_ANON_KEY: 'k' }), null)
  assert.deepEqual(auth.readAuthConfig({ VITE_SUPABASE_URL: 'https://example.invalid/', VITE_SUPABASE_ANON_KEY: 'k' }), { url: 'https://example.invalid', anonKey: 'k', googleEnabled: false })
  assert.deepEqual(auth.readAuthConfig({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'k' }), { url: 'http://127.0.0.1:54321', anonKey: 'k', googleEnabled: false })
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
  assert.deepEqual(await client.signOut(), { ok: true })
  assert.equal(client.getStoredSession(), null)
  assert.equal(auth.createAuthClient(null, { storage: store }).getStoredSession(), null, 'gone after reload')
})

const SESSION = { accessToken: 'a', refreshToken: 'r', expiresAt: 2000000000, userId: 'u-1' }

test('sign-out when removal fails overwrites the token so a reload sees no session (review finding 4)', async () => {
  const store = memoryStore()
  store.setItem(auth.SESSION_KEY, JSON.stringify(SESSION))
  const flaky = { ...store, removeItem: () => { throw new Error('removal blocked') } }
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k' }, { fetch: async () => new Response('{}'), storage: flaky })
  assert.deepEqual(await client.signOut(), { ok: true })
  assert.equal(client.getStoredSession(), null)
  assert.equal(auth.createAuthClient(null, { storage: flaky }).getStoredSession(), null, 'reload reads no session')
})

test('sign-out that cannot clear device storage reports it and still clears this client (review finding 4)', async () => {
  const store = memoryStore()
  store.setItem(auth.SESSION_KEY, JSON.stringify(SESSION))
  const stuck = { getItem: (k) => store.getItem(k), setItem: () => { throw new Error('read-only') }, removeItem: () => { throw new Error('read-only') } }
  let logoutCalled = false
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k' }, { fetch: async () => { logoutCalled = true; return new Response('{}') }, storage: stuck })
  assert.deepEqual(client.getStoredSession(), SESSION)
  const result = await client.signOut()
  assert.deepEqual(result, { ok: false, error: 'storage_unavailable' }, 'caller must not claim a durable sign-out')
  assert.equal(client.getStoredSession(), null, 'this client no longer exposes the session')
  assert.equal(logoutCalled, true, 'server-side logout is still attempted')
  // The reload boundary the result warns about: a fresh client can still read the stored copy.
  assert.deepEqual(auth.createAuthClient(null, { storage: stuck }).getStoredSession(), SESSION)
})

test('a throwing localStorage getter does not break the client', async () => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('blocked', 'SecurityError') } })
  try {
    const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k', googleEnabled: true }, { fetch: async () => { throw new TypeError('offline') } })
    assert.equal(client.getStoredSession(), null)
    assert.deepEqual(await client.startGoogleSignIn('https://app.example.invalid/cb'), { ok: false, error: 'storage_unavailable' })
    assert.deepEqual(await client.signOut(), { ok: true })
  } finally {
    if (desc) Object.defineProperty(globalThis, 'localStorage', desc)
    else delete globalThis.localStorage
  }
})
