// Pilot Scope §3 increment 2, two-device offline reconciliation (F41–F45, F51), with the client's own sync code and
// the in-memory server. Synthetic records only. Real PostgreSQL runs: supabase/tests/client/sync-live.test.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FakeSyncServer } from './fixtures/fake-sync-server.ts'
import { Device, TestAuth, session } from './sync-harness.ts'
import { Clock } from './helpers.ts'
import { timezoneAt } from '../../src/engine/calendar.ts'

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
  assert.ok(mistakes(a).length > 0, 'the offline errors created mistakes')
  assert.deepEqual(mistakes(a), [...new Set(mistakes(a))], 'one schedule per mistake')
  const records = (k: string) => a.engine.state.targets.filter((t) => `${t.knowledge_point_ref}|${t.error_type}` === k).length
  assert.ok(mistakes(a).some((k) => records(k) === 2), 'the same mistake was recorded on both devices')
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
  // Learning dates after the change use the timezone each device shows.
  const later = new Date(a.clock.t + 3_600_000).toISOString()
  for (const d of [a, b]) assert.equal(timezoneAt(later, d.engine.state.settings), d.engine.state.settings.timezone)
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

test('F51: "not a mistake" decided on one device before syncing also ends the other device’s offline record of it', async () => {
  const server = world()
  const a = await device(server)
  const b = await device(server)
  await a.practise(1, () => false)
  await b.practise(1, () => false)
  const [key] = mistakes(a)
  assert.ok(key)
  // A decides before it has seen B's record of the same mistake.
  await a.engine.invalidateTarget([...a.engine.derived().progress.values()][0].target.id, 'not_a_mistake')
  await settle(a, b)
  for (const d of [a, b]) assert.ok(!mistakes(d).includes(key), 'the decision covers every record made before it')
  // A genuinely new error after the decision starts a new mistake.
  for (const c of [a.clock, b.clock, real]) c.sgt('2027-03-03')
  await settle(a, b)
  await b.practise(1, () => false)
  await settle(a, b)
  assert.ok(mistakes(b).length > 0, 'a later error is a new mistake')
  assert.equal(progress(a), progress(b))
})

test('rule 6 / F43: two offline devices load different packs; the later accepted load becomes active everywhere and progress converges', async () => {
  const { syntheticPack } = await import('./fixtures/private-pack.ts')
  const server = world()
  const a = await device(server)
  const b = await device(server)
  const pendingRef = 'zh.p2_higher_chinese.char.u4e11'
  await a.program.installPack(syntheticPack({ pendingRef }))
  b.clock.advance(60)
  real.advance(60)
  await b.program.installPack(syntheticPack({ pendingRef, extraCase: true }))
  await settle(a, b)
  const active = async (d: Device) => (await d.pack.packs()).map((p) => p.pack_id)
  assert.deepEqual(await active(a), ['test-pack-2'])
  assert.deepEqual(await active(b), ['test-pack-2'])
  assert.deepEqual(a.program.report()!.cases.map((c) => [c.case_id, c.status]), b.program.report()!.cases.map((c) => [c.case_id, c.status]))
  assert.equal(progress(a), progress(b))
})

test('F51: case links settle after a correction meets another device’s pack load (no rewriting each other on every sync)', { timeout: 120_000 }, async () => {
  const { syntheticPack } = await import('./fixtures/private-pack.ts')
  const server = world()
  const a = await device(server)
  const b = await device(server)
  const pendingRef = 'zh.p2_higher_chinese.char.u4e11'
  await a.program.installPack(syntheticPack({ pendingRef }))
  await settle(a, b)
  // A corrects 住; B, whose clock is four minutes fast and which has not synced, loads a newer pack version. B's
  // links still name the original 住 target, stamped later than anything A writes.
  await a.engine.amendTarget('case-target:zh.p2_higher_chinese.char.u4f4f', { error_type: 'form_confusion' }, 'wrong_error_type')
  b.clock.advance(240)
  await b.program.installPack(syntheticPack({ pendingRef, extraCase: true }))
  await settle(a, b)
  for (const d of [a, b]) {
    const rows = new Map(d.program.report()!.cases.map((r) => [r.case_id, r.status]))
    assert.notEqual(rows.get('O903'), 'invalidated')
  }
  assert.equal(progress(a), progress(b))
})

test('F51: case links settle even when the other device’s later-stamped link names a corrected and then dismissed record', { timeout: 120_000 }, async () => {
  const { syntheticPack } = await import('./fixtures/private-pack.ts')
  const server = world()
  const a = await device(server)
  const b = await device(server)
  // Replacement ids that sort below the pack's own target ids (as random ids often do).
  let n = 0
  a.newId = () => `0a-${(++n).toString().padStart(5, '0')}`
  await a.open()
  const pendingRef = 'zh.p2_higher_chinese.char.u4e11'
  await a.program.installPack(syntheticPack({ pendingRef }))
  await settle(a, b)
  const original = 'case-target:zh.p2_higher_chinese.char.u4f4f'
  const { id } = await a.engine.amendTarget(original, { error_type: 'form_confusion' }, 'wrong_error_type')
  await a.engine.invalidateTarget(id, 'not_a_mistake')
  b.clock.advance(240)
  await b.program.installPack(syntheticPack({ pendingRef, extraCase: true }))
  await settle(a, b)
  for (const d of [a, b]) assert.equal(new Map(d.program.report()!.cases.map((r) => [r.case_id, r.status])).get('O903'), 'invalidated')
  assert.equal(JSON.stringify(a.program.report()!.cases.map((c) => [c.case_id, c.status])), JSON.stringify(b.program.report()!.cases.map((c) => [c.case_id, c.status])))
})
