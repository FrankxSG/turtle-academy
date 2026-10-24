// Closed allow-list validation for live-sync uploads (`pilot-sync/1`).
// The same descriptor (schema.json) is embedded in the database migration, which re-validates every upload; this
// client check stops a non-conforming change before it leaves the device. Results carry codes only, never content.
import descriptor from './schema.json' with { type: 'json' }

export type Node = {
  type?: 'object' | 'array' | 'string' | 'integer' | 'boolean'
  $ref?: string
  anyOf?: Node[]
  nullable?: boolean
  open?: boolean
  required?: string[]
  properties?: Record<string, Node>
  items?: Node
  maxItems?: number
  enum?: (string | boolean)[]
  pattern?: string
  notPattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
}

export type SyncKind =
  | 'answer_event' | 'presentation' | 'task' | 'completion' | 'checkpoint' | 'story_state' | 'target' | 'amendment'
  | 'flag' | 'suspension' | 'exposure' | 'rest_day' | 'setting' | 'timezone_change' | 'guards' | 'content_version'
  | 'pack_version' | 'active_pack' | 'case_link' | 'production_event'

export type MergeClass = 'add_only' | 'presentation' | 'task' | 'checkpoint' | 'grow' | 'target' | 'flag' | 'editable'

export interface KindSpec { class: MergeClass; key: string; deletable?: boolean; value: Node }
interface Descriptor {
  id: string
  limits: { op_bytes: number; request_bytes: number; ops_per_request: number; changes_per_op: number; pull_page: number }
  defs: Record<string, Node>
  operation: Node
  kinds: Record<SyncKind, KindSpec>
}

// A copy, so registering the pack part (below) never mutates the imported JSON module.
export const SYNC_SCHEMA = structuredClone(descriptor) as unknown as Descriptor
export const SYNC_SCHEMA_VERSION = 'pilot-sync/1'
export const LIMITS = SYNC_SCHEMA.limits

/**
 * Add the private mistake pack's part of the allow-list (src/sync/pack-schema.json). Only private-build code loads
 * it, so the public bundle carries no pack structure; until it is registered, pack changes are not valid here and
 * downloaded pack records are ignored. The server always holds both parts.
 */
export function registerPackSchema(pack: { defs: Record<string, Node>; kinds: Partial<Record<SyncKind, KindSpec>> }) {
  Object.assign(SYNC_SCHEMA.defs, pack.defs)
  Object.assign(SYNC_SCHEMA.kinds, pack.kinds)
}
export const hasKind = (kind: string): kind is SyncKind => Object.hasOwn(SYNC_SCHEMA.kinds, kind)

const patterns = new Map<string, RegExp>()
function regex(source: string): RegExp {
  let r = patterns.get(source)
  if (!r) {
    r = new RegExp(source)
    patterns.set(source, r)
  }
  return r
}
const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Structural check of one value against a descriptor node. Mirrors private.sync_node_valid. */
export function check(node: Node, value: unknown, depth = 0, defs: Record<string, Node> = SYNC_SCHEMA.defs): boolean {
  if (depth > 32) return false
  if (node.$ref !== undefined) {
    const target = defs[node.$ref]
    return target ? check(target, value, depth + 1, defs) : false
  }
  if (node.anyOf) return node.anyOf.some((n) => check(n, value, depth + 1, defs))
  if (value === null || value === undefined) return value === null && node.nullable === true
  switch (node.type) {
    case 'object': {
      if (!isPlainObject(value)) return false
      if (node.open) return true
      const props = node.properties ?? {}
      for (const key of Object.keys(value)) if (!Object.hasOwn(props, key)) return false
      for (const key of node.required ?? []) if (!Object.hasOwn(value, key)) return false
      for (const [key, child] of Object.entries(props)) {
        if (Object.hasOwn(value, key) && !check(child, value[key], depth + 1, defs)) return false
      }
      return true
    }
    case 'array': {
      if (!Array.isArray(value)) return false
      if (node.maxItems !== undefined && value.length > node.maxItems) return false
      const items = node.items
      if (!items) return value.length === 0
      return value.every((v) => check(items, v, depth + 1, defs))
    }
    case 'string': {
      if (typeof value !== 'string') return false
      if (node.enum && !node.enum.includes(value)) return false
      const length = [...value].length
      if (node.minLength !== undefined && length < node.minLength) return false
      if (node.maxLength !== undefined && length > node.maxLength) return false
      if (node.pattern !== undefined && !regex(node.pattern).test(value)) return false
      if (node.notPattern !== undefined && regex(node.notPattern).test(value)) return false
      return true
    }
    case 'integer': {
      if (typeof value !== 'number' || !Number.isInteger(value)) return false
      if (node.minimum !== undefined && value < node.minimum) return false
      if (node.maximum !== undefined && value > node.maximum) return false
      return true
    }
    case 'boolean':
      return typeof value === 'boolean' && (!node.enum || node.enum.includes(value))
    default:
      return false
  }
}

const SETTING_KEYS = ['timezone', 'ui_language', 'x:chinese', 'x:english', 'x:mathematics', 'x:science'] as const

/** The key a value must be stored under. Keys are derived from content so a change cannot be filed elsewhere. */
export function keyFor(kind: SyncKind, value: Record<string, unknown>): string | null {
  const v = value as Record<string, string | number | null>
  switch (SYNC_SCHEMA.kinds[kind].key) {
    case 'id': return String(v.id)
    case 'completion': return `${v.subject}:${v.task_id ?? v.local_date}`
    case 'story': return 'story'
    case 'guards': return 'guards'
    case 'active': return 'active'
    case 'flag': return `${v.item_id}@${v.item_version}:${v.presentation_id ?? v.flagged_at}`
    case 'suspension': return `${v.item_id}@${v.item_version ?? '*'}`
    case 'exposure': return String(v.item_id)
    case 'rest_day': return String(v.date)
    case 'changed_at': return String(v.changed_at)
    case 'subject': return String(v.subject)
    case 'version_ref': return String(v.version_ref)
    case 'case_id': return String(v.case_id)
    case 'setting': return null // checked against the value's shape below
    default: return null
  }
}

function settingMatches(key: string, value: Record<string, unknown>): boolean {
  if (!(SETTING_KEYS as readonly string[]).includes(key)) return false
  const keys = Object.keys(value).sort().join(',')
  if (key === 'timezone') return keys === 'timezone'
  if (key === 'ui_language') return keys === 'ui_language'
  return keys === 'changed_at,x'
}

export interface Change { kind: SyncKind; key: string; value?: Record<string, unknown>; deleted?: true }
export interface Stamp { t: number; c: number; d: string }
export interface Operation { op_id: string; device_id: string; device_seq: number; stamp: Stamp; changes: Change[] }

export type CheckCode = 'invalid_operation' | 'invalid_change' | 'operation_too_large'

/** Validate one change. Never returns or logs content. */
export function checkChange(c: unknown): boolean {
  if (!isPlainObject(c)) return false
  if (typeof c.kind !== 'string' || !hasKind(c.kind) || typeof c.key !== 'string') return false
  const spec = SYNC_SCHEMA.kinds[c.kind]
  if (c.deleted === true) return spec.deletable === true && !Object.hasOwn(c, 'value')
  if (Object.hasOwn(c, 'deleted') || !isPlainObject(c.value)) return false
  if (!check(spec.value, c.value)) return false
  const kind = c.kind as SyncKind
  if (kind === 'setting') return settingMatches(c.key, c.value)
  return keyFor(kind, c.value) === c.key
}

export function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

/** Validate an operation before it is queued or sent. */
export function checkOperation(op: unknown): { ok: true } | { ok: false; code: CheckCode } {
  let size: number
  try {
    size = byteLength(op)
  } catch {
    return { ok: false, code: 'invalid_operation' }
  }
  if (size > LIMITS.op_bytes) return { ok: false, code: 'operation_too_large' }
  if (!check(SYNC_SCHEMA.operation, op)) return { ok: false, code: 'invalid_operation' }
  const o = op as Operation
  if (o.stamp.d !== o.device_id || o.changes.length === 0) return { ok: false, code: 'invalid_operation' }
  if (!o.changes.every(checkChange)) return { ok: false, code: 'invalid_change' }
  return { ok: true }
}
