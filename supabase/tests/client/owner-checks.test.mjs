// Tests for the owner-run hosted Auth checks (PR #19 review findings 2 and 3).
// The hosted closed-sign-up check is run as the real CLI against a local mock Auth server;
// no external service is contacted. Run: node --experimental-strip-types --test supabase/tests/client/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as auth from '../../../src/auth/client.ts'
import { classifySignupProbe, classifyGoogleLink, PASS, FAIL, INCONCLUSIVE } from '../../../scripts/lib/owner-auth-checks.mjs'

const SCRIPT = fileURLToPath(new URL('../../../scripts/check-hosted-auth.mjs', import.meta.url))
const KEY = 'synthetic-public-key-not-real'

const json = (status, body, headers = {}) => ({ status, body: JSON.stringify(body), headers })
const refusal = (code, msg) => json(422, { code: 422, error_code: code, msg })
const SIGNUP_OFF = refusal('signup_disabled', 'Signups not allowed for this instance')
const ANON_OFF = refusal('anonymous_provider_disabled', 'Anonymous sign-ins are disabled')

/** Runs the real CLI against a mock Auth server; respond(kind) returns the mock reply per probe. */
async function runCli(respond) {
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      if (req.url !== '/auth/v1/signup' || req.headers.apikey !== KEY) {
        res.writeHead(404).end()
        return
      }
      const kind = JSON.parse(raw).email ? 'email' : 'anonymous'
      const r = respond(kind)
      res.writeHead(r.status, { 'Content-Type': 'application/json', ...r.headers }).end(r.body)
    })
  })
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
  const url = `http://127.0.0.1:${server.address().port}`
  try {
    return await new Promise((resolve) => {
      execFile(process.execPath, [SCRIPT], { env: { PATH: process.env.PATH, TA_SUPABASE_URL: url, TA_SUPABASE_ANON_KEY: KEY } }, (err, stdout, stderr) => {
        resolve({ code: err ? err.code : 0, out: stdout + stderr, url })
      })
    })
  } finally {
    server.close()
  }
}

function assertNoSecrets(run) {
  assert.ok(!run.out.includes(KEY), 'key printed')
  assert.ok(!run.out.includes(run.url), 'URL printed')
  assert.ok(!run.out.includes('Signups not allowed'), 'server text echoed')
}

test('hosted check passes only when both documented refusals are returned', async () => {
  const run = await runCli((kind) => (kind === 'email' ? SIGNUP_OFF : ANON_OFF))
  assert.equal(run.code, 0, run.out)
  assert.match(run.out, /PASS\s+email sign-up is disabled: HTTP 422: signup_disabled/)
  assert.match(run.out, /PASS\s+anonymous sign-in is disabled: HTTP 422: anonymous_provider_disabled/)
  assertNoSecrets(run)
})

test('anonymous probe refused as signup_disabled also passes (sign-up off blocks anonymous users)', async () => {
  const run = await runCli(() => SIGNUP_OFF)
  assert.equal(run.code, 0, run.out)
})

test('an invalid API key is inconclusive, never PASS (reviewer reproduction)', async () => {
  const run = await runCli(() => json(401, { message: 'Invalid API key' }))
  assert.equal(run.code, 3, run.out)
  assert.doesNotMatch(run.out, /^PASS/m)
  assert.match(run.out, /INCONCLUSIVE/)
  assertNoSecrets(run)
})

test('address, CAPTCHA, rate-limit, wrong-route and server errors are inconclusive', async () => {
  const replies = [
    refusal('email_address_invalid', 'Email address is invalid'),
    json(400, { error_code: 'captcha_failed', msg: 'captcha protection: request disallowed' }),
    json(429, { error_code: 'over_request_rate_limit', msg: 'rate limited' }),
    json(404, { message: 'no Route matched with those values' }),
    json(500, { msg: 'Internal Server Error' }),
    json(422, { msg: 'some other refusal' }),
    { status: 422, body: 'not json', headers: {} },
  ]
  for (const reply of replies) {
    const run = await runCli(() => reply)
    assert.equal(run.code, 3, `${reply.body}\n${run.out}`)
    assert.doesNotMatch(run.out, /^PASS/m)
  }
})

test('one inconclusive probe keeps the whole run inconclusive', async () => {
  const run = await runCli((kind) => (kind === 'email' ? SIGNUP_OFF : json(401, { message: 'Invalid API key' })))
  assert.equal(run.code, 3, run.out)
})

test('an accepted sign-up is a FAIL', async () => {
  const run = await runCli((kind) => (kind === 'email' ? json(200, { id: 'synthetic' }) : ANON_OFF))
  assert.equal(run.code, 1, run.out)
  assert.match(run.out, /FAIL\s+email sign-up is disabled: HTTP 200/)
})

test('the error code may come from the x-sb-error-code header; the exact legacy message is accepted only without a code', () => {
  const h = (v) => new Headers(v ? { 'x-sb-error-code': v } : {})
  assert.equal(classifySignupProbe('email_signup', 422, h('signup_disabled'), '{}').result, PASS)
  assert.equal(classifySignupProbe('email_signup', 422, h(), '{"msg":"Signups not allowed for this instance"}').result, PASS)
  assert.equal(classifySignupProbe('email_signup', 422, h('email_address_invalid'), '{"msg":"Signups not allowed for this instance"}').result, INCONCLUSIVE)
  assert.equal(classifySignupProbe('email_signup', 401, h('signup_disabled'), '{}').result, INCONCLUSIVE)
  assert.equal(classifySignupProbe('email_signup', 422, h('anonymous_provider_disabled'), '{}').result, INCONCLUSIVE)
  assert.equal(classifySignupProbe('anonymous_signin', 201, h(), '{}').result, FAIL)
})

test('the hosted check refuses a non-https remote URL', async () => {
  const code = await new Promise((resolve) => {
    execFile(process.execPath, [SCRIPT], { env: { PATH: process.env.PATH, TA_SUPABASE_URL: 'http://example.invalid', TA_SUPABASE_ANON_KEY: KEY } }, (err) => resolve(err ? err.code : 0))
  })
  assert.equal(code, 2)
})

// --- Google link test (finding 3) ---------------------------------------------------------------

function memoryStore() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }
}

/** Real client flow: start sign-in, then complete with the given callback and token-endpoint behaviour. */
async function googleFlow(callbackQuery, tokenFetch) {
  const client = auth.createAuthClient({ url: 'https://example.invalid', anonKey: 'k', googleEnabled: true }, {
    fetch: tokenFetch ?? (async () => { throw new Error('token endpoint must not be called') }),
    storage: memoryStore(),
  })
  const start = await client.startGoogleSignIn('http://127.0.0.1:54329/callback')
  assert.equal(start.ok, true)
  return client.completeGoogleSignIn(`http://127.0.0.1:54329/callback${callbackQuery}`)
}

const PARENT = 'parent-synthetic'

test('only the documented sign-up refusal passes --expect refused', async () => {
  const refused = await googleFlow('?error=access_denied&error_code=signup_disabled&error_description=Signups+not+allowed+for+this+instance')
  assert.deepEqual(refused, { ok: false, error: 'google_signup_refused' })
  assert.equal(classifyGoogleLink('refused', refused, PARENT).result, PASS)
  const viaFragment = await googleFlow('#error=access_denied&error_code=signup_disabled')
  assert.equal(classifyGoogleLink('refused', viaFragment, PARENT).result, PASS)
})

test('cancelling Google consent is inconclusive, not a refusal (reviewer reproduction)', async () => {
  const cancelled = await googleFlow('?error=access_denied')
  assert.deepEqual(cancelled, { ok: false, error: 'google_cancelled' })
  assert.equal(classifyGoogleLink('refused', cancelled, PARENT).result, INCONCLUSIVE)
  const otherCode = await googleFlow('?error=access_denied&error_code=provider_email_needs_verification')
  assert.equal(classifyGoogleLink('refused', otherCode, PARENT).result, INCONCLUSIVE)
  const serverError = await googleFlow('?error=server_error&error_description=Unable+to+exchange+external+code')
  assert.deepEqual(serverError, { ok: false, error: 'google_failed' })
  assert.equal(classifyGoogleLink('refused', serverError, PARENT).result, INCONCLUSIVE)
})

test('token-exchange network and server failures are inconclusive', async () => {
  const offline = await googleFlow('?code=abc', async () => { throw new TypeError('network down') })
  assert.deepEqual(offline, { ok: false, error: 'network' })
  assert.equal(classifyGoogleLink('refused', offline, PARENT).result, INCONCLUSIVE)
  const broken = await googleFlow('?code=abc', async () => new Response('{}', { status: 500 }))
  assert.equal(classifyGoogleLink('refused', broken, PARENT).result, INCONCLUSIVE)
  const malformed = await googleFlow('?code=abc', async () => new Response('not json', { status: 200 }))
  assert.equal(classifyGoogleLink('refused', malformed, PARENT).result, INCONCLUSIVE)
  const missingCode = await googleFlow('?state=x')
  assert.deepEqual(missingCode, { ok: false, error: 'google_failed' })
  assert.equal(classifyGoogleLink('refused', missingCode, PARENT).result, INCONCLUSIVE)
})

test('a session for a different account fails both runs; the same parent passes only --expect same', () => {
  const session = (userId) => ({ ok: true, session: { accessToken: 'a', refreshToken: 'r', expiresAt: 1, userId } })
  assert.equal(classifyGoogleLink('same', session(PARENT), PARENT).result, PASS)
  assert.equal(classifyGoogleLink('refused', session(PARENT), PARENT).result, FAIL)
  assert.equal(classifyGoogleLink('same', session('someone-else'), PARENT).result, FAIL)
  assert.equal(classifyGoogleLink('refused', session('someone-else'), PARENT).result, FAIL)
  assert.equal(classifyGoogleLink('same', { ok: false, error: 'google_signup_refused' }, PARENT).result, FAIL)
  assert.equal(classifyGoogleLink('same', { ok: false, error: 'google_cancelled' }, PARENT).result, INCONCLUSIVE)
})
