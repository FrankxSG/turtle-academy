// Pilot Scope §3 increment 2, two-device offline reconciliation (F41–F45, F51), with the client's own sync code and
// the in-memory server. Synthetic records only. Real PostgreSQL runs: supabase/tests/client/sync-live.test.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FakeSyncServer } from './fixtures/fake-sync-server.ts'
import { Device, TestAuth, session, type Q } from './sync-harness.ts'
import { Clock, correctResponse, wrongResponse } from './helpers.ts'

const FAMILY = '11111111-1111-4111-8111-111111111111'
const CHILD = '22222222-2222-4222-8222-222222222222'

/** True time, shared by the server; device clocks start equal to it and can be skewed. */
let real = new Clock('2027-03-01T09:00:00+08:00')
function world() {
  real = new Clock('2027-03-01T09:00:00+08:00')
  const server = new FakeSyncServer()
  server.nowMs = () => real.t
  server.members.set('parent-a', [{ family_id: FAMILY, child_id: CHILD }])
  server.tokens.set('token-a', 'parent-a')
  return server
}
async function device(server: FakeSyncServer, iso = '2027-03-01T09:00:00+08:00') {
  const d = new Device({ transport: server.transport(), auth: new TestAuth(session('parent-a', 'token-a')), userId: 'parent-a', clock: new Clock(iso) })
  await d.open()
  assert.equal((await d.sync()).state, 'idle')
  return d
}
/**
 * Sync every device until two whole rounds pass with every device idle and nothing waiting: one quiet round is not
 * enough, because a device that synced early in the round has not yet downloaded what a later device uploaded.
 */
async function settle(...ds: Device[]) {
  let quiet = 0
  for (let round = 0; round < 8; round++) {
    const states = []
    for (const d of ds) states.push(await d.sync())
    quiet = states.every((s) => s.state === 'idle' && s.waiting === 0) ? quiet + 1 : 0
    if (quiet === 2) return
  }
  assert.fail('devices did not settle')
}
const sortById = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id))
const progress = (d: Device) => JSON.stringify([...d.engine.derived().progress.values()]
  .map((v) => [v.target.subject, v.target.knowledge_point_ref, v.target.assessed_skill, v.target.error_type, v.stage, v.dueOn, v.notBefore, v.clearances]).sort())
const mistakes = (d: Device) => [...d.engine.derived().progress.values()].map((v) => `${v.target.knowledge_point_ref}|${v.target.error_type}`).sort()
const credit = (d: Device) => JSON.stringify({ c: d.engine.state.completions.map((c) => JSON.stringify(c)).sort(),
  s: d.engine.state.story.checkpoints.filter((c) => c.state === 'delivered').map((c) => c.id).sort() })

test('F41: two devices practise offline and reconnect: every answer kept once, one schedule per mistake, identical progress', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server)
  // Both answer the same day's opening questions wrong while offline: the same mistakes are banked on each device.
  await a.practise(2, () => false)
  await b.practise(2, () => false)
  const before = new Set([...a.engine.state.events, ...b.engine.state.events].map((e) => e.id))
  await settle(a, b)
  assert.deepEqual(sortById(a.engine.state.events), sortById(b.engine.state.events))
  assert.deepEqual(new Set(a.engine.state.events.map((e) => e.id)), before, 'every answer from both devices, once')
  assert.equal(progress(a), progress(b))
  assert.deepEqual(mistakes(a), [...new Set(mistakes(a))], 'one schedule per mistake')
  // Next day both devices, offline, finish yesterday's shared unfinished task (it satisfies today's requirement).
  for (const c of [a.clock, b.clock, real]) c.sgt('2027-03-02')
  assert.equal((await a.practise())?.done, true)
  assert.equal((await b.practise())?.done, true)
  await a.deliverStory()
  await b.deliverStory()
  await settle(a, b)
  assert.equal(credit(a), credit(b))
  assert.deepEqual(a.engine.state.completions.map((c) => c.task_id), ['t:chinese:2027-03-01:0'], 'the shared task is credited once')
  assert.equal(new Set(a.engine.state.story.checkpoints.map((c) => c.id)).size, a.engine.state.story.checkpoints.length)
  assert.equal(progress(a), progress(b))
  assert.deepEqual(mistakes(a), [...new Set(mistakes(a))])
})

test('F42: two offline devices start the same day: one task id, both devices’ presentations kept, every answer counted, day credited once', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server, '2027-03-01T09:20:00+08:00')
  await a.engine.setX('chinese', 15) // a different frozen plan on A
  const ra = await a.practise(4)
  const rb = await b.practise(3)
  assert.equal(ra!.task.id, rb!.task.id)
  await settle(a, b)
  const task = a.engine.state.tasks[0]
  assert.deepEqual(b.engine.state.tasks[0].plan, task.plan, 'the first accepted frozen plan, on both')
  assert.equal(a.engine.answeredCount(task), 7)
  assert.equal(b.engine.answeredCount(b.engine.state.tasks[0]), 7)
  // Both finish the shared task while offline again: one daily credit and one story beat per checkpoint.
  assert.equal((await a.practise())?.done, true)
  assert.equal((await b.practise())?.done, true)
  await a.deliverStory()
  await b.deliverStory()
  await settle(a, b)
  for (const d of [a, b]) {
    assert.equal(d.engine.state.completions.length, 1, 'the day is credited once')
    assert.equal(d.engine.state.tasks.length, 1)
    assert.equal(new Set(d.engine.state.story.checkpoints.map((c) => c.id)).size, d.engine.state.story.checkpoints.length)
  }
  assert.deepEqual(a.engine.state.completions, b.engine.state.completions)
  assert.equal(credit(a), credit(b))
  assert.equal(progress(a), progress(b))
})

test('F43: an earlier fast-clock edit queued offline, uploaded after a normally timed edit: replicas converge and both values stay in history', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server)
  // A's clock is 2 minutes fast (inside the server tolerance, so not clamped); its edit is made first but uploaded last.
  a.clock.advance(120)
  await a.engine.setX('chinese', 12)
  a.clock.advance(-120)
  b.clock.advance(30)
  await b.engine.setX('chinese', 15)
  assert.equal((await b.sync()).state, 'idle')
  await settle(a, b)
  // A's stamp is later, so A wins although it was uploaded second; every replica agrees.
  assert.equal(a.engine.xFor('chinese'), 12)
  assert.equal(b.engine.xFor('chinese'), 12)
  assert.equal(server.records(CHILD).find((r) => r.kind === 'setting' && r.key === 'x:chinese')!.value.x, 12)
  const replaced = server.history(CHILD).filter((h) => h.key === 'x:chinese').map((h) => (h.replaced as { x: number }).x)
  assert.ok(replaced.includes(15), 'the losing value stays in server history')
})

test('F43: a slow-clock edit made later can lose to an earlier edit; all replicas still converge and the loser is kept', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server)
  await a.engine.setX('chinese', 9)
  assert.equal((await a.sync()).state, 'idle')
  b.clock.advance(-600) // ten minutes slow
  await b.engine.setX('chinese', 18) // made later in real time
  await settle(a, b)
  assert.equal(a.engine.xFor('chinese'), b.engine.xFor('chinese'))
  const kept = server.history(CHILD).filter((h) => h.key === 'x:chinese').map((h) => (h.replaced as { x: number }).x)
  assert.ok(kept.includes(a.engine.xFor('chinese') === 9 ? 18 : 9))
  assert.equal(b.manager.status().clockWarning, true, 'the large clock difference is reported')
})

test('F43: equal stamps resolve by device id, the same way on every replica', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server)
  // Same wall-clock instant and counter on both devices.
  b.clock.set(a.clock.now())
  await a.engine.setTimezone('Asia/Tokyo')
  await b.engine.setTimezone('Asia/Kuala_Lumpur')
  await settle(a, b)
  assert.equal(a.engine.state.settings.timezone, b.engine.state.settings.timezone)
  assert.equal(server.records(CHILD).find((r) => r.kind === 'setting' && r.key === 'timezone')!.value.timezone, a.engine.state.settings.timezone)
  // The two changes share an instant, so their history entries share a key: every replica keeps the server's one,
  // because the history decides learning dates.
  assert.deepEqual(a.engine.state.settings.timezone_history, b.engine.state.settings.timezone_history)
  assert.equal(progress(a), progress(b))
})

test('F44: a device offline for a while gets every change once, including deletions, after a lost acknowledgement and a restart', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server)
  await a.engine.setRestDay()
  await settle(a, b)
  assert.ok(b.engine.state.rest_days.length === 1)
  // A practises; its upload commits on the server but the response is lost; A restarts and retries.
  await a.practise(3)
  const queued = await a.outboxIds()
  server.loseNextResponse = true
  assert.notEqual((await a.sync()).state, 'idle')
  assert.deepEqual(await a.outboxIds(), queued, 'nothing acknowledged is dropped')
  await a.open()
  await settle(a, b)
  assert.equal(server.records(CHILD).filter((r) => r.kind === 'answer_event').length, a.engine.state.events.length, 'applied once')
  assert.deepEqual(sortById(b.engine.state.events), sortById(a.engine.state.events))
  assert.equal(progress(a), progress(b))
})

test('F51: the same mistake caught on two devices gets one schedule; corrections and "not a mistake" apply to it as one', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server)
  await a.practise(1, () => false)
  await b.practise(1, () => false)
  await settle(a, b)
  const [key] = mistakes(a)
  assert.equal(mistakes(a).filter((m) => m === key).length, 1)
  assert.equal(a.engine.state.targets.filter((t) => `${t.knowledge_point_ref}|${t.error_type}` === key).length, 2, 'both records are kept')
  // Practice on either record counts for the one mistake; marking it "not a mistake" on one device ends it everywhere.
  const shown = [...a.engine.derived().progress.values()].find((v) => `${v.target.knowledge_point_ref}|${v.target.error_type}` === key)!
  await b.engine.invalidateTarget(shown.target.id, 'not_a_mistake')
  await settle(a, b)
  for (const d of [a, b]) assert.ok(!mistakes(d).includes(key))
})
