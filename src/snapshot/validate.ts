// Closed-schema validator for Pilot backup snapshots.
// The same descriptor (schema.json) is embedded in the database migration, and the database
// re-validates every upload; this client check is a convenience, never the enforcement point.
import descriptor from './schema.json' with { type: 'json' }

type Node = {
  type?: 'object' | 'array' | 'string' | 'integer' | 'boolean'
  $ref?: string
  nullable?: boolean
  required?: string[]
  properties?: Record<string, Node>
  items?: Node
  maxItems?: number
  enum?: string[]
  pattern?: string
  minimum?: number
  maximum?: number
}

type Descriptor = { id: string; defs: Record<string, Node>; root: Node }

export const SNAPSHOT_SCHEMA_VERSION = 'pilot-snapshot/1'
export const MAX_SNAPSHOT_BYTES = 1_048_576

const schema = descriptor as unknown as Descriptor
const patterns = new Map<string, RegExp>()

function regex(source: string): RegExp {
  let r = patterns.get(source)
  if (!r) {
    r = new RegExp(source)
    patterns.set(source, r)
  }
  return r
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function check(node: Node, value: unknown, depth: number): boolean {
  if (depth > 12) return false
  if (node.$ref !== undefined) {
    const target = schema.defs[node.$ref]
    if (!target) return false
    return check(target, value, depth + 1)
  }
  if (value === null) return node.nullable === true
  switch (node.type) {
    case 'object': {
      if (!isPlainObject(value)) return false
      const props = node.properties ?? {}
      for (const key of Object.keys(value)) if (!(key in props)) return false
      for (const key of node.required ?? []) if (!(key in value)) return false
      for (const [key, child] of Object.entries(props)) {
        if (key in value && !check(child, value[key], depth + 1)) return false
      }
      return true
    }
    case 'array': {
      if (!Array.isArray(value)) return false
      if (node.maxItems !== undefined && value.length > node.maxItems) return false
      const items = node.items
      if (!items) return value.length === 0
      return value.every((v) => check(items, v, depth + 1))
    }
    case 'string': {
      if (typeof value !== 'string') return false
      if (node.enum && !node.enum.includes(value)) return false
      if (node.pattern !== undefined && !regex(node.pattern).test(value)) return false
      return true
    }
    case 'integer': {
      if (typeof value !== 'number' || !Number.isInteger(value)) return false
      if (node.minimum !== undefined && value < node.minimum) return false
      if (node.maximum !== undefined && value > node.maximum) return false
      return true
    }
    case 'boolean':
      return typeof value === 'boolean'
    default:
      return false
  }
}

export type SnapshotCheck = { ok: true } | { ok: false; reason: 'too_large' | 'invalid_snapshot' | 'child_mismatch' }

/** Validate a snapshot before upload. Never logs or returns the payload's contents. */
export function validateSnapshot(payload: unknown, childId: string): SnapshotCheck {
  let size: number
  try {
    size = new TextEncoder().encode(JSON.stringify(payload)).length
  } catch {
    return { ok: false, reason: 'invalid_snapshot' }
  }
  if (size > MAX_SNAPSHOT_BYTES) return { ok: false, reason: 'too_large' }
  if (!check(schema.root, payload, 0)) return { ok: false, reason: 'invalid_snapshot' }
  if ((payload as { child_ref: string }).child_ref !== childId) return { ok: false, reason: 'child_mismatch' }
  return { ok: true }
}
