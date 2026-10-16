#!/usr/bin/env node
// Owner-run check of the hosted Auth settings required by Issue #16 (closed sign-up).
// It sends a synthetic sign-up and a synthetic anonymous sign-in to the TEST project. Each probe
// passes ONLY when the server answers with the documented refusal code (signup_disabled, or
// anonymous_provider_disabled for the anonymous probe). Any other answer, such as an invalid API
// key, an address or CAPTCHA error, rate limiting or a network failure, is INCONCLUSIVE and proves
// nothing about the setting. It never prints the URL, key or any response body.
//
// Usage (test project only; values are read from the environment, never committed):
//   TA_SUPABASE_URL=... TA_SUPABASE_ANON_KEY=... node scripts/check-hosted-auth.mjs
// Exit codes: 0 PASS, 1 FAIL (an attempt was accepted), 2 usage error, 3 INCONCLUSIVE.
//
// On FAIL a synthetic user may have been created: fix the setting, then delete that synthetic user.
import { EXIT, overall, runHostedAuthChecks } from './lib/owner-auth-checks.mjs'

const url = process.env.TA_SUPABASE_URL
const anonKey = process.env.TA_SUPABASE_ANON_KEY
if (!url || !anonKey) {
  console.error('Set TA_SUPABASE_URL and TA_SUPABASE_ANON_KEY for the test project.')
  process.exit(2)
}
let parsed
try {
  parsed = new URL(url)
} catch {
  console.error('TA_SUPABASE_URL is not a valid URL.')
  process.exit(2)
}
const local = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost'
if (!(parsed.protocol === 'https:' || (local && parsed.protocol === 'http:'))) {
  console.error('TA_SUPABASE_URL must use https.')
  process.exit(2)
}

const nonce = globalThis.crypto.randomUUID().slice(0, 8)
const results = await runHostedAuthChecks({ origin: parsed.origin, anonKey, nonce })
for (const r of results) console.log(`${r.result.padEnd(12)} ${r.label}: ${r.detail}`)
const result = overall(results)
console.log(
  result === 'PASS'
    ? 'Hosted Auth sign-up checks passed.'
    : result === 'FAIL'
      ? 'Hosted Auth sign-up checks FAILED: an attempt was accepted.'
      : 'Hosted Auth sign-up checks are INCONCLUSIVE: no documented refusal was received. Check the key and settings, then rerun.',
)
process.exit(EXIT[result])
