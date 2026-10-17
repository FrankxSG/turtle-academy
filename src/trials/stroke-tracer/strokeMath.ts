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

/** Arc-length position (0..total) of the closest point on `line` to `p`, plus that distance. */
export function projectOnto(p: Point, line: Point[]): { along: number; distance: number } {
  if (line.length === 1) return { along: 0, distance: distance(p, line[0]) }
  let best = { along: 0, distance: Infinity }
  let walked = 0
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]
    const b = line[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const segment = Math.hypot(dx, dy)
    const t = segment === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (segment * segment)))
    const d = distance(p, { x: a.x + t * dx, y: a.y + t * dy })
    if (d < best.distance) best = { along: walked + t * segment, distance: d }
    walked += segment
  }
  return best
}

export type StrokeCheckReason =
  | 'ok' | 'too-short' | 'too-long' | 'start' | 'end' | 'off-path' | 'missed-part' | 'backtrack'

export type StrokeCheck = {
  matched: boolean
  /** First failed test, for the tester panel only; never shown as a grade. */
  reason: StrokeCheckReason
  startDistance: number
  endDistance: number
  /** Mean distance of the drawn path from the reference path. */
  averageDistance: number
  /** Largest distance of any drawn point from the reference path (catches overshoot and detours). */
  maxOffPath: number
  /** Largest distance of any reference point from the drawn path (catches shortcuts and missed parts). */
  maxMissed: number
  /** Largest backwards movement along the reference path (catches backtracking and retracing). */
  maxBacktrack: number
  lengthRatio: number
}

// Tolerances in viewBox units (character box = 1024; reference strokes are
// roughly 90–120 units wide). Tuned against synthetic strokes only.
// `leniency` > 1 is kinder, < 1 stricter; it scales every distance tolerance.
export const TOLERANCES = {
  startEnd: 170,
  average: 95,
  offPath: 175,
  missed: 140,
  /** Backtracking allowed: this fraction of the stroke's length, within the min/max below. */
  backtrackFraction: 0.3,
  backtrackMin: 40,
  backtrackMax: 110,
  minLengthRatio: 0.55,
  maxLengthRatio: 1.7,
  lengthSlack: 120,
  minAbsoluteLength: 50,
}

const SAMPLES = 48

/**
 * Deterministic check that a drawn stroke follows one expected stroke, in
 * order: start near the reference start, finish near its end, stay close to
 * its path, cover all of it, keep moving forward along it, and be neither much
 * shorter nor much longer. This is geometric matching against reference data,
 * not handwriting recognition or a neatness judgement.
 */
export function checkStroke(drawn: Point[], median: Point[], leniency = 1): StrokeCheck {
  const failed = {
    startDistance: Infinity, endDistance: Infinity, averageDistance: Infinity,
    maxOffPath: Infinity, maxMissed: Infinity, maxBacktrack: Infinity, lengthRatio: 0,
  }
  if (drawn.length < 2 || median.length < 1) return { matched: false, reason: 'too-short', ...failed }
  const t = TOLERANCES
  const reference = median.length > 1 ? resample(median, SAMPLES) : median
  const samples = resample(drawn, SAMPLES)
  const expectedLength = pathLength(median)
  // Measured on the resampled path so touch-sensor noise does not inflate length.
  const drawnLength = pathLength(samples)

  const projections = samples.map((p) => projectOnto(p, reference))
  let maxBacktrack = 0
  let furthest = projections[0].along
  for (const { along } of projections) {
    furthest = Math.max(furthest, along)
    maxBacktrack = Math.max(maxBacktrack, furthest - along)
  }
  const result = {
    startDistance: distance(drawn[0], median[0]),
    endDistance: distance(drawn[drawn.length - 1], median[median.length - 1]),
    averageDistance: projections.reduce((sum, p) => sum + p.distance, 0) / projections.length,
    maxOffPath: Math.max(...projections.map((p) => p.distance)),
    maxMissed: Math.max(...reference.map((p) => distanceToPolyline(p, samples))),
    maxBacktrack,
    lengthRatio: expectedLength > 0 ? drawnLength / expectedLength : 1,
  }
  const check = (reason: StrokeCheckReason): StrokeCheck => ({ matched: reason === 'ok', reason, ...result })

  if (drawnLength < Math.max(t.minAbsoluteLength, expectedLength * t.minLengthRatio / leniency)) return check('too-short')
  if (drawnLength > expectedLength * t.maxLengthRatio * leniency + t.lengthSlack) return check('too-long')
  if (result.startDistance > t.startEnd * leniency) return check('start')
  if (result.endDistance > t.startEnd * leniency) return check('end')
  const backtrackLimit = Math.min(t.backtrackMax, Math.max(t.backtrackMin, expectedLength * t.backtrackFraction))
  if (result.maxBacktrack > backtrackLimit * leniency) return check('backtrack')
  if (result.maxOffPath > t.offPath * leniency || result.averageDistance > t.average * leniency) return check('off-path')
  if (result.maxMissed > t.missed * leniency) return check('missed-part')
  return check('ok')
}

/** Largest distance between a stroke's reference path and the straight line from its start to its end. */
export function bendDepth(median: Point[]): number {
  if (median.length < 3) return 0
  const chord = [median[0], median[median.length - 1]]
  return Math.max(...median.map((p) => distanceToPolyline(p, chord)))
}

/** Convert a median to a smooth SVG path in data space, for stroke animation. */
export function medianPath(median: number[][]): string {
  return median.map(([x, y], i) => (i === 0 ? 'M ' : 'L ') + x + ' ' + y).join(' ')
}

export function medianLength(median: number[][]): number {
  return pathLength(median.map(([x, y]) => ({ x, y })))
}
