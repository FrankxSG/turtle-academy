// The build's enabled-practice-subjects setting (VITE_PRACTICE_SUBJECTS).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePracticeSubjects } from '../../src/practice-subjects.ts'

test('unset or empty is the current release: Chinese only', () => {
  assert.deepEqual(parsePracticeSubjects(undefined), ['chinese'])
  assert.deepEqual(parsePracticeSubjects(''), ['chinese'])
  assert.deepEqual(parsePracticeSubjects('  '), ['chinese'])
})

test('all, none and lists (canonical order, case and spaces ignored)', () => {
  assert.deepEqual(parsePracticeSubjects('all'), ['chinese', 'science', 'mathematics', 'english'])
  assert.deepEqual(parsePracticeSubjects('none'), [])
  assert.deepEqual(parsePracticeSubjects('English, chinese'), ['chinese', 'english'])
})

test('unknown or repeated names fail instead of silently dropping a subject', () => {
  assert.throws(() => parsePracticeSubjects('chinese,maths'), /unknown subject "maths"/)
  assert.throws(() => parsePracticeSubjects('chinese,chinese'), /listed twice/)
  assert.throws(() => parsePracticeSubjects('chinese,'), /unknown subject ""/)
})
