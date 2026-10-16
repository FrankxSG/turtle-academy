#!/usr/bin/env node
// Owner-run check of the hosted Auth settings required by Issue #16 (closed sign-up).
// It sends a synthetic sign-up and a synthetic anonymous sign-in to the TEST project and expects
// both to be refused. It never prints the URL, key, or any response body.
//
// Usage (test project only; values are read from the environment, never committed):
//   TA_SUPABASE_URL=... TA_SUPABASE_ANON_KEY=... node scripts/check-hosted-auth.mjs
//
// A refused attempt is a PASS. If an attempt is accepted, a synthetic user may have been created:
// fix the setting, then delete that synthetic user in the dashboard.

const url = process.env.TA_SUPABASE_URL
const key = process.env.TA_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Set TA_SUPABASE_URL and TA_SUPABASE_ANON_KEY for the test project.')
  process.exit(2)
}
let origin
try {
  origin = new URL(url).origin
} catch {
  console.error('TA_SUPABASE_URL is not a valid URL.')
  process.exit(2)
}

const headers = { apikey: key, 'Content-Type': 'application/json' }
const nonce = Math.random().toString(36).slice(2, 10)

async function attempt(name, body) {
  let status
  try {
    const res = await fetch(`${origin}/auth/v1/signup`, { method: 'POST', headers, body: JSON.stringify(body) })
    status = res.status
  } catch {
    console.log(`UNKNOWN  ${name}: network error (no result)`)
    return false
  }
  const refused = status >= 400 && status < 500 && status !== 429
  console.log(`${refused ? 'PASS' : 'FAIL'}     ${name}: HTTP ${status}${refused ? ' (refused)' : ' (accepted or unexpected)'}`)
  return refused
}

const signup = await attempt('email sign-up is disabled', {
  email: `synthetic-signup-${nonce}@example.invalid`,
  password: `Synthetic-${nonce}-Password!`,
})
const anonymous = await attempt('anonymous sign-in is disabled', {})
console.log(signup && anonymous ? 'Hosted Auth sign-up checks passed.' : 'Hosted Auth sign-up checks did NOT pass.')
process.exit(signup && anonymous ? 0 : 1)
