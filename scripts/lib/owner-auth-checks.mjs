// Decision logic for the owner-run hosted Auth checks (Issue #16, PR #19 review findings 2 and 3).
// A check passes ONLY on the documented refusal. Anything else (an invalid key, an invalid
// address, a CAPTCHA requirement, rate limiting, a wrong route, a cancelled consent, a network
// failure) is INCONCLUSIVE, because it says nothing about the sign-up setting under test.
// Error codes: https://supabase.com/docs/guides/auth/debugging/error-codes
// Nothing here prints URLs, keys, emails, user ids, tokens or response bodies.

export const PASS = 'PASS'
export const FAIL = 'FAIL'
export const INCONCLUSIVE = 'INCONCLUSIVE'

// Expected refusal codes per probe. Older Auth servers that send no error_code are recognised only
// by their exact fixed message, never by status alone.
const EXPECTED = {
  email_signup: { codes: ['signup_disabled'], messages: ['Signups not allowed for this instance'] },
  // With sign-up disabled, the server may refuse an anonymous sign-in as signup_disabled before it
  // checks the anonymous provider; both mean no anonymous user can be created.
  anonymous_signin: {
    codes: ['anonymous_provider_disabled', 'signup_disabled'],
    messages: ['Anonymous sign-ins are disabled', 'Signups not allowed for this instance'],
  },
}

const SAFE_CODE = /^[a-z][a-z0-9_]{0,63}$/

/** Extracts the Auth error code (body error_code, else the x-sb-error-code header) and message. */
export function readAuthError(headers, bodyText) {
  let body = null
  try {
    body = JSON.parse(bodyText)
  } catch {
    body = null
  }
  let code = body && typeof body.error_code === 'string' ? body.error_code : null
  if (code === null && headers && typeof headers.get === 'function') code = headers.get('x-sb-error-code')
  const message = body && typeof body.msg === 'string' ? body.msg : body && typeof body.message === 'string' ? body.message : null
  return { code: code && SAFE_CODE.test(code) ? code : null, message }
}

/** Classifies one sign-up probe response. detail contains only a status and a vetted error code. */
export function classifySignupProbe(probe, status, headers, bodyText) {
  const expected = EXPECTED[probe]
  if (!expected) throw new Error('unknown probe')
  if (status >= 200 && status < 300) return { result: FAIL, detail: `HTTP ${status}: accepted (a synthetic user may have been created)` }
  const { code, message } = readAuthError(headers, bodyText)
  const refusalStatus = status === 400 || status === 403 || status === 422
  if (refusalStatus && code !== null && expected.codes.includes(code)) return { result: PASS, detail: `HTTP ${status}: ${code}` }
  if (refusalStatus && code === null && message !== null && expected.messages.includes(message)) {
    return { result: PASS, detail: `HTTP ${status}: refusal message (server sent no error code)` }
  }
  return { result: INCONCLUSIVE, detail: `HTTP ${status}: ${code ?? 'no recognised error code'} (not the expected refusal)` }
}

/** Runs both probes against /auth/v1/signup. fetchImpl is injectable for tests. */
export async function runHostedAuthChecks({ origin, anonKey, fetchImpl = fetch, nonce }) {
  const headers = { apikey: anonKey, 'Content-Type': 'application/json' }
  const probes = [
    // A syntactically valid, non-deliverable synthetic address (RFC 2606), so address validation
    // is not the reason for a refusal.
    ['email_signup', 'email sign-up is disabled', { email: `synthetic-signup-${nonce}@example.com`, password: `Synthetic-${nonce}-Password!9` }],
    ['anonymous_signin', 'anonymous sign-in is disabled', {}],
  ]
  const results = []
  for (const [probe, label, body] of probes) {
    let outcome
    try {
      const res = await fetchImpl(`${origin}/auth/v1/signup`, { method: 'POST', headers, body: JSON.stringify(body) })
      outcome = classifySignupProbe(probe, res.status, res.headers, await res.text())
    } catch {
      outcome = { result: INCONCLUSIVE, detail: 'network error (no response)' }
    }
    results.push({ probe, label, ...outcome })
  }
  return results
}

/** Overall result: FAIL if anything was accepted, PASS only if every probe passed. */
export function overall(results) {
  if (results.some((r) => r.result === FAIL)) return FAIL
  return results.every((r) => r.result === PASS) ? PASS : INCONCLUSIVE
}

export const EXIT = { [PASS]: 0, [FAIL]: 1, [INCONCLUSIVE]: 3 }

/**
 * Google link test outcome. expect 'refused' passes only on the server's sign-up refusal
 * (google_signup_refused); a cancelled consent, a network or token-exchange failure or any other
 * error is inconclusive. expect 'same' passes only when the session belongs to the provisioned parent.
 */
export function classifyGoogleLink(expect, result, parentId) {
  if (result.ok) {
    if (result.session.userId === parentId) {
      return expect === 'same'
        ? { result: PASS, detail: 'signed in as the SAME pre-provisioned parent' }
        : { result: FAIL, detail: 'the different account signed in as the provisioned parent: check the identity link' }
    }
    return { result: FAIL, detail: 'signed in as a DIFFERENT account: delete that synthetic user and fix the sign-up setting' }
  }
  if (result.error === 'google_signup_refused') {
    return expect === 'refused'
      ? { result: PASS, detail: 'the server refused to create an account (signup_disabled)' }
      : { result: FAIL, detail: 'the server refused the matching account: it is not linked to the provisioned parent' }
  }
  return { result: INCONCLUSIVE, detail: `not a sign-up refusal (${result.error}); repeat the run` }
}
