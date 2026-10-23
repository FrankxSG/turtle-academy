// HTTPS calls to the live-sync server functions (PostgREST RPC). Uses the public, RLS-bound anon key plus the
// parent's access token; never a service key. Errors carry a category and the server's error code only: request
// and response bodies are never logged or echoed.
import type { Operation, Stamp } from './validate.ts'
import type { RemoteRecord } from './changes.ts'

export type TransportErrorKind =
  | 'offline' | 'timeout' | 'aborted' | 'unauthorized' | 'forbidden' | 'conflict' | 'rejected' | 'server' | 'bad_response'

export class TransportError extends Error {
  readonly kind: TransportErrorKind
  /** Server error code (e.g. `operation_conflict`) or HTTP status; never content. */
  readonly code: string
  constructor(kind: TransportErrorKind, code: string) {
    super(`${kind}:${code}`)
    this.name = 'TransportError'
    this.kind = kind
    this.code = code
  }
}

export interface PushResult {
  server_time_ms: number
  results: ({ op_id: string; status: 'applied' | 'duplicate'; stamp: Stamp } | { op_id: string | null; status: 'rejected'; code: string })[]
}
export interface PullPage {
  changes: (RemoteRecord & { seq: number })[]
  cursor: number
  head: number
  more: boolean
  server_time_ms: number
}
export interface Membership { family_id: string; child_id: string }

export interface SyncTransport {
  whoami(token: string, signal: AbortSignal): Promise<Membership[]>
  push(token: string, childId: string, ops: Operation[], signal: AbortSignal): Promise<PushResult>
  pull(token: string, childId: string, cursor: number, limit: number, signal: AbortSignal): Promise<PullPage>
}

export function createTransport(config: { url: string; anonKey: string }, deps: { fetch?: typeof fetch; timeoutMs?: number } = {}): SyncTransport {
  const doFetch = deps.fetch ?? globalThis.fetch
  const timeoutMs = deps.timeoutMs ?? 20_000

  async function rpc<T>(name: string, args: unknown, token: string, signal: AbortSignal): Promise<T> {
    const timeout = new AbortController()
    const timer = setTimeout(() => timeout.abort(), timeoutMs)
    const onAbort = () => timeout.abort()
    signal.addEventListener('abort', onAbort)
    let res: Response
    try {
      res = await doFetch(`${config.url}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: config.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(args),
        signal: timeout.signal,
      })
    } catch {
      if (signal.aborted) throw new TransportError('aborted', 'aborted')
      if (timeout.signal.aborted) throw new TransportError('timeout', 'timeout')
      throw new TransportError('offline', 'network')
    } finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
    }
    if (signal.aborted) throw new TransportError('aborted', 'aborted')
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    if (!res.ok) {
      const message = typeof (body as { message?: unknown })?.message === 'string' ? String((body as { message: string }).message) : ''
      // Server functions raise short codes; anything else is reduced to the HTTP status.
      const code = /^[a-z_]{3,40}$/.test(message) ? message : String(res.status)
      if (res.status === 401) throw new TransportError('unauthorized', code)
      if (res.status === 403) throw new TransportError('forbidden', code)
      if (res.status === 409) throw new TransportError('conflict', code)
      if (res.status === 400 || res.status === 413 || res.status === 422) throw new TransportError('rejected', code)
      throw new TransportError('server', code)
    }
    if (body === null) throw new TransportError('bad_response', 'empty')
    return body as T
  }

  return {
    async whoami(token, signal) {
      const r = await rpc<unknown>('sync_whoami', {}, token, signal)
      if (!Array.isArray(r)) throw new TransportError('bad_response', 'whoami')
      return r as Membership[]
    },
    async push(token, childId, ops, signal) {
      const r = await rpc<PushResult>('sync_push', { p_child_id: childId, p_ops: ops }, token, signal)
      if (!r || !Array.isArray(r.results)) throw new TransportError('bad_response', 'push')
      return r
    },
    async pull(token, childId, cursor, limit, signal) {
      const r = await rpc<PullPage>('sync_pull', { p_child_id: childId, p_cursor: cursor, p_limit: limit }, token, signal)
      if (!r || !Array.isArray(r.changes) || typeof r.cursor !== 'number') throw new TransportError('bad_response', 'pull')
      return r
    },
  }
}
