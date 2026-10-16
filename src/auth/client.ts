// Pilot sign-in for the single pre-provisioned parent (Issue #16).
// Email/password only. There is deliberately no sign-up, anonymous or Google path in this module:
// sign-up and anonymous sign-in must also be disabled in the hosted Auth settings, which is the
// real enforcement (see supabase/README.md). Google login stays off until the owner records a
// passing staging link test (Pilot Scope section 3).

export type AuthConfig = { url: string; anonKey: string }

export type Session = {
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch seconds
  userId: string
}

export type AuthError = 'invalid_credentials' | 'rate_limited' | 'network' | 'unavailable' | 'not_configured'
export type AuthResult = { ok: true; session: Session } | { ok: false; error: AuthError }

export type KeyValueStore = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const SESSION_KEY = 'ta.auth.session.v1'
export const GOOGLE_LOGIN_ENABLED = false

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
  const local = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost'
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) return null
  return { url: parsed.origin, anonKey }
}

type Deps = { fetch?: typeof fetch; storage?: KeyValueStore | null; now?: () => number }

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

export function createAuthClient(config: AuthConfig | null, deps: Deps = {}) {
  const doFetch = deps.fetch ?? globalThis.fetch
  const storage = deps.storage === undefined ? (globalThis as { localStorage?: KeyValueStore }).localStorage ?? null : deps.storage

  function save(session: Session | null): void {
    if (!storage) return
    try {
      if (session) storage.setItem(SESSION_KEY, JSON.stringify(session))
      else storage.removeItem(SESSION_KEY)
    } catch {
      // Storage can be unavailable or full; the in-memory result is still returned.
    }
  }

  function getStoredSession(): Session | null {
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

  async function tokenRequest(grant: 'password' | 'refresh_token', body: Record<string, string>): Promise<AuthResult> {
    if (!config) return { ok: false, error: 'not_configured' }
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
    save(session)
    return { ok: true, session }
  }

  return {
    /** Sign in the pre-provisioned parent with email and password. */
    signInWithPassword(email: string, password: string): Promise<AuthResult> {
      if (!email.includes('@') || password.length === 0) return Promise.resolve({ ok: false, error: 'invalid_credentials' })
      return tokenRequest('password', { email: email.trim(), password })
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

    /** Clears the local session; the server-side logout is best effort. */
    async signOut(): Promise<void> {
      const current = getStoredSession()
      save(null)
      if (!config || !current) return
      try {
        await doFetch(`${config.url}/auth/v1/logout`, {
          method: 'POST',
          headers: { apikey: config.anonKey, Authorization: `Bearer ${current.accessToken}` },
        })
      } catch {
        // Offline sign-out still clears this device.
      }
    },
  }
}

export type AuthClient = ReturnType<typeof createAuthClient>
