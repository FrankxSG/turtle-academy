import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { bendDepth, checkStroke, resample, toView, type Point } from '../../src/trials/stroke-tracer/strokeMath'
import { INVALID, VALID, shortcut } from '../support/syntheticStrokes'

// Guided-checker geometry for the StrokeTracer trial (Issue #8).
// Synthetic strokes derived from the bundled reference data only.
const CHARACTERS = ['人', '大', '山', '木', '水', '字']
const strokes = CHARACTERS.flatMap((character) => {
  const data = JSON.parse(readFileSync(new URL('../../src/trials/stroke-tracer/data/' + character + '.json', import.meta.url), 'utf8'))
  return (data.medians as number[][][]).map((median, i) => ({ label: character + ' stroke ' + (i + 1), index: i, character, median: median.map(toView) }))
})

test.describe('guided checker on all six sample characters', () => {
  for (const variant of VALID) {
    test('accepts: ' + variant.name, () => {
      const rejected = strokes.filter((s) => !checkStroke(variant.make(s.median), s.median).matched).map((s) => s.label)
      expect(rejected).toEqual([])
    })
  }

  for (const variant of INVALID) {
    test('rejects: ' + variant.name, () => {
      const accepted = strokes.filter((s) => checkStroke(variant.make(s.median), s.median).matched).map((s) => s.label)
      expect(accepted).toEqual([])
    })
  }

  test('rejects every other stroke of the same character (wrong order)', () => {
    const accepted: string[] = []
    for (const target of strokes) {
      for (const other of strokes) {
        if (other.character === target.character && other.index !== target.index
          && checkStroke(resample(other.median, 60), target.median).matched) accepted.push(other.label + ' as ' + target.label)
      }
    }
    expect(accepted).toEqual([])
  })

  test('rejects straight shortcuts across clear bends, accepts them on near-straight strokes', () => {
    const wrong: string[] = []
    for (const s of strokes) {
      const bend = bendDepth(s.median)
      const matched = checkStroke(shortcut(s.median), s.median).matched
      // Bends between 60 and 150 units are not asserted: small hooks are not enforced (documented limitation).
      if (bend >= 150 && matched) wrong.push(s.label + ' accepted (bend ' + bend.toFixed(0) + ')')
      if (bend <= 60 && !matched) wrong.push(s.label + ' rejected (bend ' + bend.toFixed(0) + ')')
    }
    expect(wrong).toEqual([])
  })
})

test.describe('checker margins', () => {
  for (const leniency of [0.9, 1.3]) {
    test('valid and invalid results hold at leniency ' + leniency, () => {
      const errors: string[] = []
      for (const s of strokes) {
        for (const v of VALID) if (!checkStroke(v.make(s.median), s.median, leniency).matched) errors.push('rejected ' + v.name + ' on ' + s.label)
        for (const v of INVALID) if (checkStroke(v.make(s.median), s.median, leniency).matched) errors.push('accepted ' + v.name + ' on ' + s.label)
      }
      expect(errors).toEqual([])
    })
  }

  test('reports the failing test for the tester panel', () => {
    const median = strokes[0].median
    expect(checkStroke(resample(median, 40).reverse(), median).reason).toBe('start')
    const tap: Point[] = [median[0], { x: median[0].x + 4, y: median[0].y + 4 }]
    expect(checkStroke(tap, median).reason).toBe('too-short')
  })
})
