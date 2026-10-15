// Synthetic stroke generators for the StrokeTracer trial checker.
// Every stroke here is computed from the bundled reference medians; no real
// handwriting is used or stored. Randomness is seeded so results reproduce.
import { pathLength, projectOnto, resample, type Point } from '../../src/trials/stroke-tracer/strokeMath'

export type Variant = { name: string; make: (median: Point[]) => Point[] }

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const dense = (median: Point[]) => resample(median, 60)

/** Unit normal at each point of an evenly resampled line. */
function normals(line: Point[]): Point[] {
  return line.map((_, i) => {
    const a = line[Math.max(0, i - 1)]
    const b = line[Math.min(line.length - 1, i + 1)]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const length = Math.hypot(dx, dy) || 1
    return { x: -dy / length, y: dx / length }
  })
}

function offsetAlong(line: Point[], amount: (fraction: number, i: number) => number): Point[] {
  const n = normals(line)
  return line.map((p, i) => {
    const k = amount(i / (line.length - 1), i)
    return { x: p.x + n[i].x * k, y: p.y + n[i].y * k }
  })
}

/** Portion of a line between two arc-length fractions. */
export function portion(line: Point[], from: number, to: number): Point[] {
  const points = dense(line)
  const total = pathLength(points)
  return points.filter((p) => {
    const along = projectOnto(p, points).along / (total || 1)
    return along >= from - 1e-9 && along <= to + 1e-9
  })
}

/** Low-frequency sideways wobble: random offsets at a few control points, smoothly interpolated. */
function wobble(line: Point[], amplitude: number, seed: number): Point[] {
  const r = seeded(seed)
  const controls = Array.from({ length: 6 }, () => (r() - 0.5) * 2 * amplitude)
  return offsetAlong(line, (f) => {
    const x = f * (controls.length - 1)
    const i = Math.min(controls.length - 2, Math.floor(x))
    const t = x - i
    const smooth = t * t * (3 - 2 * t)
    return controls[i] * (1 - smooth) + controls[i + 1] * smooth
  })
}

function scaleAbout(line: Point[], factor: number): Point[] {
  const cx = line.reduce((s, p) => s + p.x, 0) / line.length
  const cy = line.reduce((s, p) => s + p.y, 0) / line.length
  return line.map((p) => ({ x: cx + (p.x - cx) * factor, y: cy + (p.y - cy) * factor }))
}

/** Traces a careful learner might plausibly draw; all should be accepted. */
export const VALID: Variant[] = [
  { name: 'exact reference', make: (m) => dense(m) },
  { name: 'hand wobble ±35', make: (m) => wobble(dense(m), 35, 7) },
  { name: 'sensor noise ±4 on 200 points', make: (m) => { const r = seeded(11); return resample(m, 200).map((p) => ({ x: p.x + (r() - 0.5) * 8, y: p.y + (r() - 0.5) * 8 })) } },
  { name: 'gentle wave 45', make: (m) => offsetAlong(dense(m), (f) => Math.sin(f * Math.PI * 2) * 45) },
  { name: 'drawn 9% smaller', make: (m) => scaleAbout(dense(m), 0.91) },
  { name: 'drawn 9% larger', make: (m) => scaleAbout(dense(m), 1.09) },
  { name: 'shifted 55,-45', make: (m) => dense(m).map((p) => ({ x: p.x + 55, y: p.y - 45 })) },
  { name: 'starts late, ends early', make: (m) => portion(m, 0.06, 0.92) },
  { name: 'uneven speed (few points)', make: (m) => resample(m, 6) },
  { name: 'small hook at start', make: (m) => { const d = dense(m); return [{ x: d[0].x + 25, y: d[0].y - 20 }, ...d] } },
]

/** Traces that do not follow the expected stroke; all should be rejected. */
export const INVALID: Variant[] = [
  { name: 'reversed', make: (m) => dense(m).reverse() },
  { name: 'follow, backtrack to middle, finish', make: (m) => { const d = dense(m); return [...d, ...d.slice(30).reverse(), ...d.slice(30)] } },
  { name: 'scribble back and forth 3x', make: (m) => { const d = dense(m); return [...d, ...[...d].reverse(), ...d] } },
  { name: 'overshoot 250 then return', make: (m) => { const d = dense(m); const e = d[d.length - 1]; const n = normals(d)[d.length - 1]; return [...d, { x: e.x + n.x * 250, y: e.y + n.y * 250 }, e] } },
  { name: 'only first 40%', make: (m) => portion(m, 0, 0.4) },
  { name: 'detour bulge 230', make: (m) => offsetAlong(dense(m), (f) => Math.sin(f * Math.PI) * 230) },
  { name: 'shifted 300 right', make: (m) => dense(m).map((p) => ({ x: p.x + 300, y: p.y })) },
  { name: 'tiny tap', make: (m) => [m[0], { x: m[0].x + 4, y: m[0].y + 4 }] },
]

/** Straight line from start to end, skipping any bend. */
export const shortcut = (m: Point[]) => resample([m[0], m[m.length - 1]], 40)
