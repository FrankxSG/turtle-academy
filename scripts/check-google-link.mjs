#!/usr/bin/env node
// Owner-run staging link test for Google sign-in (supabase/README.md).
// Google login may be switched on (VITE_GOOGLE_LOGIN=on) only after BOTH runs below pass on the TEST
// project and the result is recorded on the PR. It prints only PASS/FAIL lines: never the project URL
// in the result, keys, emails, user ids or tokens.
//
// Prerequisites (test project only): sign-up and anonymous sign-in OFF; Google provider ON;
// http://127.0.0.1:54329/callback on the Auth redirect allow-list; the synthetic parent provisioned with
// a verified email that matches a synthetic Google test account.
//
// Run 1 — the matching Google account must sign in as the SAME parent:
//   TA_SUPABASE_URL=… TA_SUPABASE_ANON_KEY=… TA_PARENT_EMAIL=… TA_PARENT_PASSWORD=… \
//     node --experimental-strip-types scripts/check-google-link.mjs --expect same
// Run 2 — a different Google account must be REFUSED (no new user created):
//     … node --experimental-strip-types scripts/check-google-link.mjs --expect refused
//
// Run 2 passes ONLY on the server's documented sign-up refusal (signup_disabled). Cancelling the
// Google consent screen, a network or token-exchange failure, or any other error is INCONCLUSIVE.
// Exit codes: 0 PASS, 1 FAIL, 2 usage error, 3 INCONCLUSIVE.
import { createServer } from 'node:http'
import { createAuthClient, readAuthConfig } from '../src/auth/client.ts'
import { classifyGoogleLink, EXIT } from './lib/owner-auth-checks.mjs'

const expect = process.argv[process.argv.indexOf('--expect') + 1]
if (!['same', 'refused'].includes(expect)) {
  console.error('Use --expect same (matching account) or --expect refused (a different account).')
  process.exit(2)
}
const base = readAuthConfig({ VITE_SUPABASE_URL: process.env.TA_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: process.env.TA_SUPABASE_ANON_KEY })
const { TA_PARENT_EMAIL: email, TA_PARENT_PASSWORD: password } = process.env
if (!base || !email || !password) {
  console.error('Set TA_SUPABASE_URL, TA_SUPABASE_ANON_KEY, TA_PARENT_EMAIL and TA_PARENT_PASSWORD for the test project.')
  process.exit(2)
}

function memoryStore() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }
}

const pw = await createAuthClient(base, { storage: memoryStore() }).signInWithPassword(email, password)
if (!pw.ok) {
  console.log(`INCONCLUSIVE password sign-in of the provisioned parent failed: ${pw.error}`)
  process.exit(3)
}
const parentId = pw.session.userId

// The gate is forced on for this test client only; the app stays off until the result is recorded.
const google = createAuthClient({ ...base, googleEnabled: true }, { storage: memoryStore() })
const PORT = 54329
const start = await google.startGoogleSignIn(`http://127.0.0.1:${PORT}/callback`)
if (!start.ok) {
  console.log(`INCONCLUSIVE could not start Google sign-in: ${start.error}`)
  process.exit(3)
}

const server = createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) {
    res.writeHead(404).end()
    return
  }
  const result = await google.completeGoogleSignIn(`http://127.0.0.1:${PORT}${req.url}`)
  const outcome = classifyGoogleLink(expect, result, parentId)
  console.log(`${outcome.result.padEnd(12)} expected ${expect}: ${outcome.detail}`)
  res.writeHead(200, { 'Content-Type': 'text/plain' }).end(`${outcome.result} - you can close this tab.`)
  server.close()
  process.exitCode = EXIT[outcome.result]
})
server.listen(PORT, '127.0.0.1', () => {
  console.log('Open this link in a browser and sign in with the Google test account for this run:')
  console.log(start.url)
})
