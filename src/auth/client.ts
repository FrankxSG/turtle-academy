// Pilot sign-in for the single pre-provisioned parent (Issue #16).
// Email/password is always available. Google sign-in (OAuth with PKCE) is built but OFF by default:
// it is switched on only by setting VITE_GOOGLE_LOGIN=on after the owner records a passing staging
// link test on the PR (Pilot Scope section 3). There is deliberately no sign-up or anonymous path:
// sign-up and anonymous sign-in must also be disabled in the hosted Auth settings, which is the real
// enforcement (see supabase/README.md). A Google account that is not linked to the pre-provisioned
// parent gets no family membership, so RLS gives it no data.

export type AuthConfig = { url: string; anonKey: string; googleEnabled: boolean }

export type Session = {
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch seconds
  userId: string
}

export type AuthError =
  | 'invalid_credentials'
  | 'rate_limited'
  | 'network'
  | 'unavailable'
  | 'not_configured'
  | 'google_disabled'
  | 'google_cancelled'
  | 'google_signup_refused'
  | 'google_failed'
  | 'storage_unavailable'
  | 'superseded'
export type AuthResult = { ok: true; session: Session } | { ok: false; error: AuthError }

// superseded: a sign-out or a newer sign-in happened while this request was waiting for the server.
// Its late answer is discarded (never stored or returned) and its session is revoked best effort.

/** storage_unavailable: a session or pending Google verifier may survive reload; tell the parent. */
export type SignOutResult = { ok: true } | { ok: false; error: 'storage_unavailable' }

export type KeyValueStore = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const SESSION_KEY = 'ta.auth.session.v1'
export const PKCE_KEY = 'ta.auth.pkce.v1'
// Written in place of the session when removal fails, so a later reload reads "no session".
const SIGNED_OUT = 'signed-out'
// GoTrue's documented code (and, for older servers that send no code, its fixed message) for a
// refused account creation. Only this counts as "sign-up refused"; anything else is a cancellation
// or a failure. https://supabase.com/docs/guides/auth/debugging/error-codes
const SIGNUP_DISABLED_CODE = 'signup_disabled'
const SIGNUP_DISABLED_MESSAGE = 'Signups not allowed for this instance'

/** Reads public client configuration. The anon key is a public, RLS-bound key, never a service key. */
export function readAuthConfig(env: Record<string, string | undefined>): AuthConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!isSafeOrigin(parsed)) return null
  // Off unless explicitly switched on, and only after the staging link test is recorded.
  return { url: parsed.origin, anonKey, googleEnabled: env.VITE_GOOGLE_LOGIN?.trim() === 'on' }
}

function isSafeOrigin(u: URL): boolean {
  const local = u.hostname === '127.0.0.1' || u.hostname === 'localhost'
  return u.protocol === 'https:' || (local && u.protocol === 'http:')
}

function base64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64url(globalThis.crypto.getRandomValues(new Uint8Array(32)))
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: base64url(new Uint8Array(digest)) }
}

type Deps = { fetch?: typeof fetch; storage?: KeyValueStore | null; now?: () => number }

export type GoogleStart = { ok: true; url: string } | { ok: false; error: AuthError }

function toSession(body: unknown): Session | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const user = b.user as Record<string, unknown> | undefined
  const expiresAt = typeof b.expires_at === 'number' ? b.expires_at : null
  if (typeof b.access_token !== 'string' || typeof b.refresh_token !== 'string' || !user || typeof user.id !== 'string' || expiresAt === null) {
    return null
  }
  return { accessToken: b.access_token, refreshToken: b.refresh_token, expiresAt, userId: user.id }
}

function mapStatus(status: number): AuthError {
  if (status === 400 || status === 401 || status === 403 || status === 422) return 'invalid_credentials'
  if (status === 429) return 'rate_limited'
  return 'unavailable'
}

/** The browser's localStorage, or null where reading the property itself throws (blocked storage). */
function defaultStorage(): KeyValueStore | null {
  try {
    return (globalThis as { localStorage?: KeyValueStore }).localStorage ?? null
  } catch {
    return null
  }
}

/** Distinguishes a server refusal to create an account from a cancellation or a failure. */
export function classifyAuthRedirectError(params: URLSearchParams): AuthError {
  const code = params.get('error_code')
  if (code === SIGNUP_DISABLED_CODE) return 'google_signup_refused'
  if (code === null && params.get('error_description') === SIGNUP_DISABLED_MESSAGE) return 'google_signup_refused'
  if (code === null && params.get('error') === 'access_denied') return 'google_cancelled'
  return 'google_failed'
}

export function createAuthClient(config: AuthConfig | null, deps: Deps = {}) {
  const doFetch = deps.fetch ?? globalThis.fetch
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage
  // This instance's view of the session. undefined = not yet known, so read storage.
  // After sign-out it is null even if the device storage could not be cleared.
  let current: Session | null | undefined
  // Identity generation. Sign-out and every sign-in start move it on, and a successful sign-in moves
  // it on again, so an older request that completes late (a background refresh, a slow sign-in) is
  // stale: it must neither persist credentials nor hand its session to the caller.
  let generation = 0

  function clearPendingGoogleSignIn(): boolean {
    if (!storage) return true
    try {
      storage.removeItem(PKCE_KEY)
      return true
    } catch {
      try {
        storage.setItem(PKCE_KEY, '') // a callback must not exchange a cancelled verifier
        return true
      } catch {
        return false
      }
    }
  }

  /** Persists the session; returns false if the device copy could not be written or cleared. */
  function save(session: Session | null): boolean {
    current = session
    if (!storage) return session === null
    try {
      if (session) storage.setItem(SESSION_KEY, JSON.stringify(session))
      else storage.removeItem(SESSION_KEY)
      return true
    } catch {
      if (session) return false // full or blocked storage: the in-memory session is still used
    }
    try {
      storage.setItem(SESSION_KEY, SIGNED_OUT) // removal failed: overwrite the token instead
      return true
    } catch {
      return false
    }
  }

  function getStoredSession(): Session | null {
    if (current !== undefined) return current
    if (!storage) return null
    try {
      const raw = storage.getItem(SESSION_KEY)
      if (!raw) return null
      const s = JSON.parse(raw) as Session
      if (typeof s.accessToken !== 'string' || typeof s.refreshToken !== 'string' || typeof s.userId !== 'string' || typeof s.expiresAt !== 'number') {
        return null
      }
      return s
    } catch {
      return null
    }
  }

  /** Best-effort server revocation of one discarded session only (never the parent's other sessions). */
  async function revokeLocally(session: Session): Promise<void> {
    if (!config) return
    try {
      await doFetch(`${config.url}/auth/v1/logout?scope=local`, {
        method: 'POST',
        headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}` },
      })
    } catch {
      // Offline: the discarded tokens are not stored anywhere on this device.
    }
  }

  async function tokenRequest(grant: 'password' | 'refresh_token' | 'pkce', body: Record<string, string>): Promise<AuthResult> {
    if (!config) return { ok: false, error: 'not_configured' }
    // A sign-in replaces the identity, so it makes every older pending request stale. A refresh only
    // renews the current identity, so it joins the current generation without moving it.
    const issuedIn = grant === 'refresh_token' ? generation : ++generation
    let res: Response
    try {
      res = await doFetch(`${config.url}/auth/v1/token?grant_type=${grant}`, {
        method: 'POST',
        headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      return { ok: false, error: 'network' }
    }
    if (!res.ok) return { ok: false, error: mapStatus(res.status) }
    let parsed: unknown
    try {
      parsed = await res.json()
    } catch {
      return { ok: false, error: 'unavailable' }
    }
    const session = toSession(parsed)
    if (!session) return { ok: false, error: 'unavailable' }
    if (issuedIn !== generation) {
      await revokeLocally(session)
      return { ok: false, error: 'superseded' }
    }
    if (grant !== 'refresh_token') generation++ // refreshes issued before this sign-in landed are stale
    save(session)
    return { ok: true, session }
  }

  return {
    /** Sign in the pre-provisioned parent with email and password. */
    signInWithPassword(email: string, password: string): Promise<AuthResult> {
      if (!email.includes('@') || password.length === 0) return Promise.resolve({ ok: false, error: 'invalid_credentials' })
      return tokenRequest('password', { email: email.trim(), password })
    },

    /**
     * Step 1 of Google sign-in: returns the URL to navigate to. The app's callback page must be on the
     * hosted project's redirect allow-list. Refused unless Google login is switched on.
     */
    async startGoogleSignIn(redirectTo: string): Promise<GoogleStart> {
      if (!config) return { ok: false, error: 'not_configured' }
      if (!config.googleEnabled) return { ok: false, error: 'google_disabled' }
      let redirect: URL
      try {
        redirect = new URL(redirectTo)
      } catch {
        return { ok: false, error: 'not_configured' }
      }
      if (!isSafeOrigin(redirect)) return { ok: false, error: 'not_configured' }
      if (!storage) return { ok: false, error: 'storage_unavailable' }
      const startedIn = ++generation
      const { verifier, challenge } = await pkcePair()
      if (startedIn !== generation) return { ok: false, error: 'superseded' }
      try {
        storage.setItem(PKCE_KEY, verifier)
      } catch {
        return { ok: false, error: 'storage_unavailable' }
      }
      const q = new URLSearchParams({
        provider: 'google',
        redirect_to: redirect.toString(),
        code_challenge: challenge,
        code_challenge_method: 's256',
      })
      return { ok: true, url: `${config.url}/auth/v1/authorize?${q}` }
    },

    /** Step 2 of Google sign-in: call on the callback page with its full URL. */
    async completeGoogleSignIn(callbackUrl: string): Promise<AuthResult> {
      if (!config) return { ok: false, error: 'not_configured' }
      if (!config.googleEnabled) return { ok: false, error: 'google_disabled' }
      let verifier: string | null = null
      try {
        verifier = storage ? storage.getItem(PKCE_KEY) : null
        storage?.removeItem(PKCE_KEY) // single use, whatever the outcome
      } catch {
        return { ok: false, error: 'storage_unavailable' }
      }
      let params: URLSearchParams
      try {
        const u = new URL(callbackUrl)
        params = new URLSearchParams(u.search)
        // Errors may arrive in the fragment instead of the query.
        for (const [k, v] of new URLSearchParams(u.hash.replace(/^#/, ''))) if (!params.has(k)) params.set(k, v)
      } catch {
        return { ok: false, error: 'google_failed' }
      }
      // A refusal ("sign-ups not allowed"), a cancellation and other failures are kept apart.
      if (params.has('error') || params.has('error_code')) return { ok: false, error: classifyAuthRedirectError(params) }
      const code = params.get('code')
      if (!code || !verifier) return { ok: false, error: 'google_failed' }
      return tokenRequest('pkce', { auth_code: code, code_verifier: verifier })
    },

    /** Exchange the stored refresh token for a new session (requires network). */
    async refreshSession(): Promise<AuthResult> {
      const current = getStoredSession()
      if (!current) return { ok: false, error: 'invalid_credentials' }
      return tokenRequest('refresh_token', { refresh_token: current.refreshToken })
    },

    /** Last saved session, even if expired; callers decide whether it is still usable. */
    getStoredSession,

    isExpired(session: Session): boolean {
      const now = deps.now ? deps.now() : Date.now()
      return session.expiresAt * 1000 <= now
    },

    /**
     * Clears the session from this client at once, then from device storage. Returns
     * storage_unavailable when the device copy could not be removed or overwritten: the caller must
     * not claim a durable sign-out, because a reload could restore the session. Pending Google
     * verifiers are also cleared; a PKCE generation still in flight cannot recreate one. Any sign-in or refresh
     * still waiting for the server is superseded and cannot restore a session when it answers late.
     * Server-side logout is best effort and never changes the local result.
     */
    async signOut(): Promise<SignOutResult> {
      generation++ // any request still waiting for the server can no longer restore a session
      const previous = getStoredSession()
      const durable = save(null)
      const googleCleared = clearPendingGoogleSignIn()
      if (config && previous) {
        try {
          await doFetch(`${config.url}/auth/v1/logout`, {
            method: 'POST',
            headers: { apikey: config.anonKey, Authorization: `Bearer ${previous.accessToken}` },
          })
        } catch {
          // Offline sign-out still clears this device.
        }
      }
      return durable && googleCleared ? { ok: true } : { ok: false, error: 'storage_unavailable' }
    },
  }
}

export type AuthClient = ReturnType<typeof createAuthClient>
