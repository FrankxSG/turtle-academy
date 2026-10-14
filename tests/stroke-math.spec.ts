import { expect, test } from '@playwright/test'
import { checkStroke, resample, toView, type Point } from '../src/trials/stroke-tracer/strokeMath'

// Pure geometry checks for the StrokeTracer trial; synthetic strokes only.
// First stroke of 人 from the bundled reference data, in data space.
const median = [[483, 736], [508, 702], [511, 678], [473, 552], [408, 416], [328, 303], [271, 244], [144, 139], [72, 95]].map(toView)
const shift = (line: Point[], dx: number, dy: number) => line.map((p) => ({ x: p.x + dx, y: p.y + dy }))

test('a stroke drawn along the reference median matches', () => {
  expect(checkStroke(resample(median, 40), median).matched).toBe(true)
})

test('a slightly wobbly stroke within tolerance still matches', () => {
  const wobbly = resample(median, 40).map((p, i) => ({ x: p.x + (i % 2 ? 40 : -40), y: p.y }))
  expect(checkStroke(wobbly, median).matched).toBe(true)
})

test('a reversed stroke fails on its start point', () => {
  expect(checkStroke(resample(median, 40).reverse(), median).reason).toBe('start')
})

test('a stroke in the wrong place fails', () => {
  expect(checkStroke(shift(median, 420, 0), median).matched).toBe(false)
})

test('a tiny tap does not count as a stroke', () => {
  expect(checkStroke([median[0], { x: median[0].x + 5, y: median[0].y + 5 }], median).reason).toBe('too-short')
})

test('leniency widens the tolerance', () => {
  const off = shift(median, 200, 0)
  expect(checkStroke(off, median, 1).matched).toBe(false)
  expect(checkStroke(off, median, 1.6).matched).toBe(true)
})

test('resample keeps endpoints and the requested count', () => {
  const out = resample(median, 24)
  expect(out).toHaveLength(24)
  expect(out[0]).toEqual(median[0])
  expect(out[23].x).toBeCloseTo(median[median.length - 1].x, 5)
})
