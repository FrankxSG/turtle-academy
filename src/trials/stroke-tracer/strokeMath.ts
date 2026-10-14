// Pure geometry for the StrokeTracer trial. No DOM, no storage, no AI.
//
// Coordinates: Make Me a Hanzi / hanzi-writer-data uses a 1024-unit box with
// the y axis pointing up (roughly -124 at the bottom, 900 at the top). The
// tracer draws in SVG viewBox space (y down), so data points are flipped once
// with `toView` and every comparison below happens in viewBox units.

export type Point = { x: number; y: number }

export type CharacterData = {
  strokes: string[]
  medians: number[][][]
  radStrokes?: number[]
}

export const VIEW_SIZE = 1024
/** SVG transform that maps data space (y up) onto the 0–1024 viewBox (y down). */
export const DATA_TRANSFORM = 'translate(0, 900) scale(1, -1)'

export function toView([x, y]: number[]): Point {
  return { x, y: 900 - y }
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function pathLength(points: Point[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i])
  return total
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return distance(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared))
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy })
}

export function distanceToPolyline(p: Point, line: Point[]): number {
  if (line.length === 1) return distance(p, line[0])
  let best = Infinity
  for (let i = 1; i < line.length; i++) best = Math.min(best, distanceToSegment(p, line[i - 1], line[i]))
  return best
}

/** Evenly resample a polyline so long and short drawings are compared fairly. */
export function resample(points: Point[], count: number): Point[] {
  if (points.length < 2 || count < 2) return points.slice()
  const total = pathLength(points)
  if (total === 0) return Array.from({ length: count }, () => ({ ...points[0] }))
  const step = total / (count - 1)
  const out: Point[] = [{ ...points[0] }]
  let carried = 0
  for (let i = 1; i < points.length && out.length < count; i++) {
    let a = points[i - 1]
    const b = points[i]
    let segment = distance(a, b)
    while (carried + segment >= step && out.length < count) {
      const t = (step - carried) / segment
      a = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
      out.push(a)
      segment = distance(a, b)
      carried = 0
    }
    carried += segment
  }
  while (out.length < count) out.push({ ...points[points.length - 1] })
  return out
}

export type StrokeCheck = {
  matched: boolean
  /** Which test failed first, for trial diagnostics only; never shown as a grade. */
  reason: 'ok' | 'too-short' | 'start' | 'end' | 'shape'
  startDistance: number
  endDistance: number
  averageDistance: number
}

// Thresholds in viewBox units (character box = 1024). Tuned by hand against
// synthetic strokes; `leniency` > 1 is kinder, < 1 is stricter.
const START_END_TOLERANCE = 190
const AVERAGE_TOLERANCE = 120
const MIN_LENGTH_RATIO = 0.35
const MIN_ABSOLUTE_LENGTH = 50

/**
 * Deterministic check that a drawn stroke follows one expected stroke: it must
 * start near the expected start, end near the expected end (so a reversed
 * stroke fails), stay close to the median line and cover enough of it.
 * This is geometric matching against reference data, not handwriting
 * recognition or a neatness judgement.
 */
export function checkStroke(drawn: Point[], median: Point[], leniency = 1): StrokeCheck {
  const empty = { startDistance: Infinity, endDistance: Infinity, averageDistance: Infinity }
  if (drawn.length < 2 || median.length < 1) return { matched: false, reason: 'too-short', ...empty }
  const startDistance = distance(drawn[0], median[0])
  const endDistance = distance(drawn[drawn.length - 1], median[median.length - 1])
  const samples = resample(drawn, 24)
  const averageDistance = samples.reduce((sum, p) => sum + distanceToPolyline(p, median), 0) / samples.length
  const result = { startDistance, endDistance, averageDistance }
  const drawnLength = pathLength(drawn)
  const expectedLength = pathLength(median)
  if (drawnLength < Math.max(MIN_ABSOLUTE_LENGTH, expectedLength * MIN_LENGTH_RATIO / leniency)) {
    return { matched: false, reason: 'too-short', ...result }
  }
  if (startDistance > START_END_TOLERANCE * leniency) return { matched: false, reason: 'start', ...result }
  if (endDistance > START_END_TOLERANCE * leniency) return { matched: false, reason: 'end', ...result }
  if (averageDistance > AVERAGE_TOLERANCE * leniency) return { matched: false, reason: 'shape', ...result }
  return { matched: true, reason: 'ok', ...result }
}

/** Convert a median to a smooth SVG path in data space, for stroke animation. */
export function medianPath(median: number[][]): string {
  return median.map(([x, y], i) => (i === 0 ? 'M ' : 'L ') + x + ' ' + y).join(' ')
}

export function medianLength(median: number[][]): number {
  return pathLength(median.map(([x, y]) => ({ x, y })))
}
