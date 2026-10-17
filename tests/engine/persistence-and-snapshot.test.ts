// F27, AC1 (legacy guest isolation), AC4 (populated local snapshot against the #16 validator).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classifyLegacy, inspectLegacy, type LegacyMarker } from '../../src/engine/legacy.ts'
import { PINNED_SNAPSHOT_SCHEMA, exportSnapshot } from '../../src/engine/snapshot.ts'
import { SNAPSHOT_SCHEMA_VERSION, validateSnapshot } from '../../src/snapshot/validate.ts'
import { scienceRelease } from './fixtures/catalogue.ts'
import { correctResponse, harness, registryWith, reload, runTask, startTask, wrongResponse } from './helpers.ts'

const CHILD = '0b9c3a52-4c1e-4b8e-9a51-2d7f0c4e8a10' // synthetic

test('F27: a failed local save keeps the answer in memory, warns honestly, and retries in order', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  h.store.failAll = true
  const s1 = await h.engine.next(t.id)
  if (s1.kind !== 'question') throw new Error('expected question')
  const r1 = await h.engine.answer(s1.presentation.id, wrongResponse(s1.item))
  assert.equal(r1.correct, false, 'help is still available: the response is held in memory')
  assert.equal(r1.saved?.warning, 'unsaved_changes_may_be_lost_on_reload')
  assert.ok((r1.saved?.pending ?? 0) >= 1)
  await h.engine.retry(s1.presentation.id, correctResponse(s1.item)) // continues with the warning
  assert.equal(h.writer.status().lastError, 'QuotaExceededError')
  assert.equal(h.timers.queue.length, 1, 'one background retry is scheduled (backoff, not a hot loop)')
  await h.timers.runAll()
  assert.equal(h.timers.queue.length, 1, 'still failing: rescheduled once')
  // Storage recovers: the background retry commits everything, oldest first.
  h.store.failAll = false
  await h.timers.runAll()
  assert.equal(h.writer.status().pending, 0)
  assert.equal(h.writer.status().warning, null)
  const order = h.store.commitOrder
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'commits never reorder')
  const e = await reload(h)
  assert.equal(e.state.events.length, 2, 'first response and retry both survived once committed')
})

test('F27: foreground return retries; unsaved memory is lost on reload, as the warning said', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  h.store.failAll = true
  const s = await h.engine.next(t.id)
  if (s.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(s.presentation.id, correctResponse(s.item))
  const lost = await reload(h) // reload before any successful retry
  assert.equal(lost.state.events.length, 0)
  // A separate run: foreground return commits pending work.
  const h2 = harness({ subjects: ['mathematics'] })
  const t2 = await startTask(h2.engine, 'mathematics')
  const s2 = await h2.engine.next(t2.id)
  if (s2.kind !== 'question') throw new Error('expected question')
  h2.store.failNext = 2
  const r = await h2.engine.answer(s2.presentation.id, correctResponse(s2.item))
  assert.equal(r.saved?.pending, 1)
  const after = await h2.writer.onForeground()
  assert.equal(after.pending, 0)
  assert.equal(h2.store.events.size, 1)
})

test('F27: the store applies a repeated mutation once and rejects conflicting event rewrites (append-only)', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await startTask(h.engine, 'mathematics')
  const m = { id: 'mut-1', order: 99, puts: [], events: [{ id: 'ev-1', presentation_id: 'p-1', local_seq: 0, phase: 'first' as const, assistance: 'none' as const, response: { kind: 'single' as const, option_ids: ['a'], pairs: [] }, correct: true, at: '2027-03-01T01:00:00.000Z' }] }
  await h.store.commit(m)
  await h.store.commit(m)
  assert.equal(h.store.events.size, 1)
  await assert.rejects(h.store.commit({ ...m, id: 'mut-2', events: [{ ...m.events[0], correct: false }] }), /append-only/)
})

test('AC4: a populated synthetic snapshot passes the #16 validator, pinned to pilot-snapshot/1, with private fields absent', async () => {
  assert.equal(PINNED_SNAPSHOT_SCHEMA, SNAPSHOT_SCHEMA_VERSION)
  const base = scienceRelease()
  base.items = base.items.filter((i) => i.id !== 'sci-1-acq-3')
  const h = harness({ subjects: ['chinese', 'mathematics'] })
  h.registry.install(base)
  await h.engine.setX('chinese', 6)
  await h.engine.setX('science', 6)
  // Passage aggregation: a banked Chinese target assessed through materials.
  const c1 = await startTask(h.engine, 'chinese')
  let first = true
  await runTask(h.engine, c1.id, () => { const ok = !first; first = false; return ok })
  // Partial Science acquisition plus a flag (exposure, flag and suspension state).
  const s1 = await startTask(h.engine, 'science')
  let step = await h.engine.next(s1.id)
  if (step.kind === 'teaching') { await h.engine.completeTeaching(s1.id); step = await h.engine.next(s1.id) }
  if (step.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(step.presentation.id, correctResponse(step.item))
  const second = await h.engine.next(s1.id)
  if (second.kind !== 'question') throw new Error('expected question')
  await h.engine.flag(second.presentation.id, 'question_unclear')
  await runTask(h.engine, s1.id)
  // Calendar guards via a timezone change; a pending (undelivered) checkpoint; a paused task mid-material.
  await h.engine.setTimezone('Asia/Tokyo')
  h.clock.sgt('2027-03-02')
  const c2 = await startTask(h.engine, 'chinese')
  await runTask(h.engine, c2.id, () => true, { stopAfter: 2 })
  await h.engine.pause(c2.id)
  await h.engine.setRestDay()
  const { snapshot, check } = exportSnapshot(h.engine.state, h.engine.derived(), CHILD, h.clock.now(),
    { operation_id: '4f1d2c3b-5a6e-4f70-8a9b-0c1d2e3f4a5b', base_snapshot_id: null, queued_at: h.clock.now() })
  assert.deepEqual(check, { ok: true })
  assert.equal(snapshot.schema_version, 'pilot-snapshot/1')
  // Populated, not empty.
  assert.ok(snapshot.story.checkpoints.some((c) => c.state === 'pending'), 'pending checkpoint')
  assert.ok(snapshot.tasks.some((t) => t.target_aggregates.some((a) => a.route === 'whole_task')), 'passage aggregation')
  assert.ok(snapshot.tasks.some((t) => t.status === 'paused' && t.cursor < t.plan.slots.length), 'active task cursor')
  assert.ok(snapshot.exposure.length > 0 && snapshot.suspensions.length > 0 && snapshot.flags.length > 0)
  assert.ok(snapshot.calendar_guards.last_timezone_change_at !== null && snapshot.settings.timezone_history.length === 1)
  assert.ok(snapshot.rest_days.length === 1 && snapshot.eligibility.length > 0 && snapshot.completions.length >= 2)
  const sci1 = [...h.engine.derived().progress.values()].find((p) => p.target.knowledge_point_ref === 'sci-1')
  assert.equal(sci1?.stage, 'acquisition')
  assert.equal(sci1?.acquisitionSuccessItems.length, 1, 'partial acquisition is recoverable from the events in the snapshot')
  // Private, device-local data is absent.
  const json = JSON.stringify(snapshot)
  for (const forbidden of ['observed_wrong_form', 'wrong_form', 'pin', 'pin_hash', 'guest', 'schemaVersion', 'lastAnswer']) {
    assert.ok(!new RegExp(`"${forbidden}"`, 'i').test(json), `no ${forbidden} key`)
  }
  // The validator is a real check: an unknown key or a foreign child is rejected.
  assert.deepEqual(validateSnapshot({ ...snapshot, observed_wrong_form: 'x' }, CHILD), { ok: false, reason: 'invalid_snapshot' })
  assert.deepEqual(validateSnapshot(snapshot, '11111111-2222-4333-8444-555555555555'), { ok: false, reason: 'child_mismatch' })
  // Restoring the snapshot's records reproduces the same derived progress.
  const restored = await reload(h)
  assert.deepEqual([...restored.derived().progress.values()].map((p) => [p.target.id, p.stage, p.dueOn]),
    [...h.engine.derived().progress.values()].map((p) => [p.target.id, p.stage, p.dueOn]))
})

test('AC1: the legacy guest checkpoint is classified, never altered, never migrated, and inspection is idempotent', async () => {
  assert.equal(classifyLegacy(undefined), 'absent')
  assert.equal(classifyLegacy({ id: 'sample', schemaVersion: 1, attempts: 3, lastAnswer: 'stone' }), 'guest_sample')
  for (const bad of [{ id: 'sample', schemaVersion: 2, attempts: 1, lastAnswer: null }, { id: 'sample', schemaVersion: 1, attempts: -1, lastAnswer: null },
    { id: 'sample', schemaVersion: 1, attempts: 1, lastAnswer: 'dragon' }, { id: 'sample', schemaVersion: 1, attempts: 1, lastAnswer: null, child: 'x' }, 'junk', [1]]) {
    assert.equal(classifyLegacy(bad), 'unrecognised')
  }
  const legacy = Object.freeze({ id: 'sample', schemaVersion: 1, attempts: 4, lastAnswer: 'turtle' })
  let stored: LegacyMarker | undefined
  let failNext = true
  const markers = {
    async getMarker() { return stored },
    async putMarker(m: LegacyMarker) {
      if (failNext) { failNext = false; throw new Error('interrupted') }
      stored = structuredClone(m)
    },
  }
  const reader = { async readSample() { return legacy } }
  // Interrupted upgrade: nothing partial is kept; the next startup completes it.
  await assert.rejects(inspectLegacy(reader, markers, '2027-03-01T00:00:00.000Z'))
  assert.equal(stored, undefined)
  const m1 = await inspectLegacy(reader, markers, '2027-03-01T00:01:00.000Z')
  const m2 = await inspectLegacy(reader, markers, '2027-03-05T00:00:00.000Z')
  assert.deepEqual(m1, { status: 'guest_sample', first_seen_at: '2027-03-01T00:01:00.000Z', migrated: false })
  assert.deepEqual(m2, m1, 'repeated startup changes nothing')
  assert.deepEqual(legacy, { id: 'sample', schemaVersion: 1, attempts: 4, lastAnswer: 'turtle' }, 'original data untouched')
  // Corrupt or unreadable legacy data is only labelled.
  const corrupt = await inspectLegacy({ async readSample() { return { nonsense: true } } }, markers, '2027-03-06T00:00:00.000Z')
  assert.equal(corrupt.status, 'unrecognised')
  assert.equal(corrupt.first_seen_at, '2027-03-01T00:01:00.000Z')
  const unreadable = await inspectLegacy({ async readSample() { throw new Error('blocked') } }, markers, '2027-03-07T00:00:00.000Z')
  assert.equal(unreadable.status, 'unreadable')
  // The legacy sample never becomes child evidence.
  const h = harness({ subjects: ['mathematics'] })
  assert.equal(h.engine.state.targets.length + h.engine.state.events.length + h.engine.state.completions.length, 0)
})

test('fixtures stay outside release catalogue paths and are marked development-only', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs')
  // Nothing in the release paths (src/, content/) refers to the engine's synthetic fixtures.
  for (const root of ['../../src', '../../content']) {
    const base = new URL(`${root}/`, import.meta.url)
    for (const f of readdirSync(base, { recursive: true }) as string[]) {
      const u = new URL(f, base)
      if (statSync(u).isFile()) assert.ok(!readFileSync(u, 'utf8').includes('engine/fixtures'), `${root}/${f}`)
    }
  }
  assert.equal(scienceRelease().development_only, true)
  const r = registryWith(scienceRelease())
  assert.equal(r.current('science')?.development_only, true)
})
