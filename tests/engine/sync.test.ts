// Live sync, first milestone (one signed-in iPad): client behaviour against an in-memory server with the same
// contract as the PostgreSQL functions. Synthetic learner records and an invented pack only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dailyTaskId } from '../../src/engine/engine.ts'
import { PackRejected } from '../../src/mistakes/program.ts'
import { stripPack, syncablePack, versionRef, withLocalWrongForms } from '../../src/sync/pack.ts'
import { newMeta, observe, tick } from '../../src/sync/outbox.ts'
import { checkChange, checkOperation } from '../../src/sync/validate.ts'
import { MemorySyncPrivateStore, MemorySyncRecordStore } from '../../src/sync/store.ts'
import { SyncManager } from '../../src/sync/manager.ts'
import type { PrivatePack } from '../../src/mistakes/pack.ts'
import { FakeSyncServer } from './fixtures/fake-sync-server.ts'
import { syntheticPack } from './fixtures/private-pack.ts'
import { Device, TestAuth, session } from './sync-harness.ts'
import { Clock } from './helpers.ts'
import { publicChinese } from './fixtures/public-chinese.ts'
import { buildChineseContent, poolSizes } from '../../src/catalogue/chinese.ts'

const FAMILY = '11111111-1111-4111-8111-111111111111'
const CHILD = '22222222-2222-4222-8222-222222222222'
const OTHER_FAMILY = '33333333-3333-4333-8333-333333333333'
const OTHER_CHILD = '44444444-4444-4444-8444-444444444444'

// Sentinels that must never leave the device.
const WRONG_FORM = '错形哨兵'
const RATIONALE = 'RATIONALE-SENTINEL-NOTE'
const PROVENANCE = 'PROVENANCE-SENTINEL-NOTE'

// A grade-list character with no questions in the public bank, so its case imports as pending content.
const PENDING_REF = (() => {
  const content = publicChinese()
  const built = buildChineseContent({ courses: ['p2_higher_chinese', 'p3_higher_chinese'], ...content })
  return content.lists.characters.find((c) => c.course === 'p2_higher_chinese' && Object.values(poolSizes(built.release, c.id)).every((n) => n === 0))!.id
})()

function invented(opts: { extraCase?: boolean } = {}): PrivatePack {
  const p = syntheticPack({ pendingRef: PENDING_REF, ...opts }) as unknown as PrivatePack
  for (const c of p.register.cases) c.observed = WRONG_FORM
  for (const b of p.corrective_batches) for (const i of b.items as unknown as Record<string, unknown>[]) { i.rationale = RATIONALE; i.provenance = PROVENANCE }
  return p
}

function world() {
  const server = new FakeSyncServer()
  server.members.set('parent-a', [{ family_id: FAMILY, child_id: CHILD }])
  server.members.set('parent-b', [{ family_id: OTHER_FAMILY, child_id: OTHER_CHILD }])
  server.tokens.set('token-a', 'parent-a')
  server.tokens.set('token-b', 'parent-b')
  return server
}

async function device(server: FakeSyncServer, opts: { user?: string; token?: string; clock?: Clock; records?: MemorySyncRecordStore; pack?: MemorySyncPrivateStore } = {}) {
  const auth = new TestAuth(session(opts.user ?? 'parent-a', opts.token ?? 'token-a'))
  const d = new Device({ transport: server.transport(), auth, userId: opts.user ?? 'parent-a', clock: opts.clock, records: opts.records, pack: opts.pack })
  await d.open()
  return { d, auth }
}

const sortById = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id))


test('bootstrap readiness stays closed until recovery completes, including offline failures and restart', async () => {
  const server = world()
  const { d } = await device(server)
  assert.equal(d.manager.status().practiceReady, false, 'account lookup has not run yet')
  assert.equal((await d.manager.refresh()).practiceReady, false)
  server.offline = true
  assert.equal((await d.sync()).practiceReady, false)
  await d.open()
  assert.equal((await d.sync()).practiceReady, false, 'restart must not bypass bootstrap')
  server.offline = false
  assert.equal((await d.sync()).practiceReady, true)
  server.offline = true
  assert.equal((await d.sync()).practiceReady, true, 'initialized practice keeps working offline')
})

test('a crash immediately after first binding preserves the recovery intent', async () => {
  const server = world()
  const { d: source } = await device(server)
  await source.practise(2)
  await source.sync()
  const records = new MemorySyncRecordStore()
  const bind = records.bind.bind(records)
  let crash = true
  records.bind = async (...args) => {
    const result = await bind(...args)
    if (crash) { crash = false; throw new Error('simulated_crash') }
    return result
  }
  const { d } = await device(server, { records })
  const failed = await d.sync()
  assert.equal(failed.state, 'failed')
  assert.equal(failed.practiceReady, false)
  assert.ok((await records.meta()).owner)
  assert.equal((await records.meta()).recovery?.done, false)
  await d.open()
  assert.equal((await d.sync()).practiceReady, true)
  assert.equal(d.engine.state.events.length, 2)
  assert.deepEqual(d.engine.state.tasks[0].plan, source.engine.state.tasks[0].plan)
})

test('an older refresh cannot close practice again after bootstrap finishes', async () => {
  const server = world()
  const { d } = await device(server)
  let release!: () => void
  let entered!: () => void
  const held = new Promise<void>((resolve) => { release = resolve })
  const reached = new Promise<void>((resolve) => { entered = resolve })
  let first = true
  d.pack.issue = async () => {
    if (first) { first = false; entered(); await held }
    return null
  }
  const old = d.manager.refresh()
  await reached
  assert.equal((await d.sync()).practiceReady, true)
  release()
  await old
  assert.equal(d.manager.status().practiceReady, true)
})

test('production-only writes schedule automatic upload without an engine commit', async () => {
  const server = world()
  const { d } = await device(server)
  await d.program.installPack(invented())
  await d.sync()
  d.syncTimers.queue = []
  const plan = [...d.program.plans().keys()][0]
  const event = await d.program.recordProduction(plan, 'independent', 'correct')
  await new Promise((r) => setTimeout(r, 0)) // the observer schedules after refreshing the waiting count
  assert.ok(d.syncTimers.queue.length > 0, 'pack commits must wake the sync manager')
  await d.syncTimers.runAll()
  await d.manager.syncNow('change') // join the automatically started flight
  assert.ok(server.records(CHILD).some((r) => r.kind === 'production_event' && r.key === event.id))
  d.manager.dispose()
  d.syncTimers.queue = []
  await d.program.recordProduction(plan, 'independent', 'correct')
  assert.equal(d.syncTimers.queue.length, 0, 'sign-out removes the pack listener')
})

test('a pack-store change with nothing waiting (an acknowledgement) schedules no extra run', async () => {
  const server = world()
  const { d } = await device(server)
  await d.program.installPack(invented())
  assert.equal((await d.sync()).waiting, 0)
  d.syncTimers.queue = []
  ;(d.pack as unknown as { changed: () => void }).changed() // as the IndexedDB observer does after acknowledgements
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(d.syncTimers.queue.length, 0)
  d.manager.dispose()
})

test('an acknowledged upload followed by a failed download does not advance last successful sync', async () => {
  const server = world()
  const { d } = await device(server)
  const before = (await d.sync()).lastSyncAt
  d.clock.advance(60)
  await d.practise(1)
  const transport = server.transport()
  transport.pull = async () => { throw new (await import('../../src/sync/transport.ts')).TransportError('offline', 'network') }
  const { SyncManager } = await import('../../src/sync/manager.ts')
  d.manager.dispose()
  const m = new SyncManager({ transport, auth: new TestAuth(session('parent-a', 'token-a')), identity: 'key-parent-a', identityOf: async (u) => `key-${u}`,
    records: d.records, pack: d.pack, engine: d.engine, online: () => true, timers: d.syncTimers })
  const failed = await m.syncNow()
  assert.equal(failed.state, 'offline')
  assert.equal(failed.waiting, 0, 'upload was acknowledged')
  assert.equal(failed.lastSyncAt, before, 'the complete run did not succeed')
  m.dispose()
})

test('daily task ids are deterministic per child, subject and learning day', async () => {
  const server = world()
  const { d } = await device(server)
  const r = await d.practise(1)
  assert.equal(r?.task.id, dailyTaskId('chinese', '2027-03-01', 0))
  assert.equal(r?.task.id, 't:chinese:2027-03-01:0')
})

test('online practice uploads, is acknowledged, and server readback matches the device', async () => {
  const server = world()
  const { d } = await device(server)
  await d.practise(3)
  await d.engine.setX('chinese', 12)
  const status = await d.sync()
  assert.equal(status.state, 'idle', JSON.stringify(status))
  assert.equal(status.waiting, 0)
  assert.ok(status.lastSyncAt)
  const recs = server.records(CHILD)
  const events = recs.filter((r) => r.kind === 'answer_event').map((r) => r.value)
  assert.deepEqual(sortById(events as never[]), sortById(d.engine.state.events.map((e) => ({ ...e })) as never[]))
  const task = recs.find((r) => r.kind === 'task')!.value as Record<string, unknown>
  const local = d.engine.state.tasks[0]
  assert.deepEqual(task.plan, local.plan)
  assert.equal(task.cursor, local.cursor)
  assert.deepEqual(task.target_aggregates, [])
  assert.deepEqual(recs.find((r) => r.kind === 'setting' && r.key === 'x:chinese')!.value, { x: 12, changed_at: d.engine.state.settings.subjects.find((s) => s.subject === 'chinese')!.changed_at })
  assert.equal(recs.filter((r) => r.kind === 'presentation').length, d.engine.state.presentations.length)
})

test('allow-list: uploads never carry wrong forms, authoring notes, device metadata or derived values', async () => {
  const server = world()
  const { d } = await device(server)
  await d.program.installPack(invented())
  await d.practise(4, () => false)
  const plan = [...d.program.plans().keys()][0]
  await d.program.recordProduction(plan, 'independent', 'correct')
  await d.sync()
  const sent = server.requests.filter((r) => r.fn === 'push').map((r) => r.body).join('\n')
  // Wrong forms, authoring notes and device-only metadata (the local event counter) never appear in a request.
  for (const s of [WRONG_FORM, RATIONALE, PROVENANCE, '"observed"', '"rationale"', '"provenance"', '"next_seq"', '"pin"', '"pin_hash"', '"salt"', '"digest"', '"blockedUntil"'])
    assert.ok(!sent.includes(s), `upload contains ${s}`)
  // Derived values are never uploaded: no due dates, eligibility or derived stages outside presentations.
  for (const s of ['"dueOn"', '"due_on"', '"eligibility"', '"not_before"', '"notBefore"']) assert.ok(!sent.includes(s), `upload contains ${s}`)
  const stored = JSON.stringify(server.records(CHILD))
  for (const s of [WRONG_FORM, RATIONALE, PROVENANCE, '"observed"', '"rationale"', '"provenance"']) assert.ok(!stored.includes(s), `server holds ${s}`)
  // Task aggregates (a recomputed cache) are never uploaded with content.
  for (const r of server.records(CHILD).filter((x) => x.kind === 'task')) assert.deepEqual((r.value as { target_aggregates: unknown[] }).target_aggregates, [])
  // The device that loaded the pack keeps its wrong forms.
  assert.ok((await d.pack.packs())[0].register.cases.every((c) => c.observed === WRONG_FORM))
})

test('the closed descriptor refuses unknown fields, wrong forms and spoofed keys', () => {
  const pack = stripPack(invented())
  const ok = { kind: 'pack_version', key: 'test-pack-1@0123456789abcdef', value: { version_ref: 'test-pack-1@0123456789abcdef', pack } }
  assert.equal(checkChange(ok), true)
  const withObserved = structuredClone(ok); (withObserved.value.pack.register.cases[0] as Record<string, unknown>).observed = 'x'
  assert.equal(checkChange(withObserved), false)
  const withNote = structuredClone(ok); (withNote.value.pack.corrective_batches[0].items[0] as unknown as Record<string, unknown>).rationale = 'x'
  assert.equal(checkChange(withNote), false)
  const longCause = structuredClone(ok); longCause.value.pack.register.cases[0].cause = 'x'.repeat(49)
  assert.equal(checkChange(longCause), false)
  const datedCause = structuredClone(ok); datedCause.value.pack.register.cases[0].cause = 'seen 2026-05-04'
  assert.equal(checkChange(datedCause), false)
  const emailCase = structuredClone(ok); emailCase.value.pack.register.cases[0].correction_status = 'a@b.co'
  assert.equal(checkChange(emailCase), false)
  assert.equal(checkChange({ kind: 'setting', key: 'timezone', value: { timezone: 'Asia/Singapore' } }), true)
  assert.equal(checkChange({ kind: 'setting', key: 'timezone', value: { ui_language: 'en' } }), false)
  assert.equal(checkChange({ kind: 'setting', key: 'pin_hash', value: { timezone: 'Asia/Singapore' } }), false)
  assert.equal(checkChange({ kind: 'rest_day', key: '2027-03-02', value: { date: '2027-03-01' } }), false)
  assert.equal(checkChange({ kind: 'rest_day', key: '2027-03-01', deleted: true }), true)
  assert.equal(checkChange({ kind: 'answer_event', key: 'e1', deleted: true }), false)
  assert.equal(checkChange({ kind: 'snapshot', key: 'x', value: {} }), false)
  const event = { id: 'e1', presentation_id: 'p1', local_seq: 0, phase: 'first', assistance: 'none', response: { kind: 'single', option_ids: ['a'], pairs: [] }, correct: true, at: '2027-03-01T01:00:00.000Z' }
  assert.equal(checkChange({ kind: 'answer_event', key: 'e1', value: event }), true)
  assert.equal(checkChange({ kind: 'answer_event', key: 'e1', value: { ...event, observed_wrong_form: 'x' } }), false)
  assert.equal(checkChange({ kind: 'answer_event', key: 'e2', value: event }), false)
  assert.equal(checkOperation({ op_id: 'not-a-uuid', device_id: CHILD, device_seq: 1, stamp: { t: 1, c: 0, d: CHILD }, changes: [] }).ok, false)
})

test('a pack that cannot sync is refused at install, before anything is saved', async () => {
  const server = world()
  const { d } = await device(server)
  const bad = invented()
  bad.corrective_batches[0].items[0].stem = '题'.repeat(601)
  assert.equal((await syncablePack(bad)).ok, false)
  await assert.rejects(d.program.installPack(bad), (e: unknown) => e instanceof PackRejected && (e as Error).message === 'pack_not_syncable')
  assert.equal((await d.pack.packs()).length, 0)
})

test('pack versions are content-addressed and wrong forms are restored only for the same register case', async () => {
  const a = invented()
  const ref1 = await versionRef(stripPack(a))
  const ref2 = await versionRef(stripPack(structuredClone(a)))
  assert.equal(ref1, ref2)
  assert.match(ref1, /^test-pack-1@[0-9a-f]{16}$/)
  const changed = invented({ extraCase: true })
  assert.notEqual(await versionRef(stripPack(changed)), ref1)
  const restored = withLocalWrongForms(stripPack(changed), a)
  assert.equal(restored.register.cases.find((c) => c.id === 'O901')!.observed, WRONG_FORM)
  assert.equal(restored.register.cases.find((c) => c.id === 'O907')!.observed, undefined)
  assert.equal(withLocalWrongForms(stripPack(a), null).register.cases[0].observed, undefined)
})

test('hybrid logical clock: monotonic local stamps that move past accepted server stamps', () => {
  const m = newMeta('55555555-5555-4555-8555-555555555555')
  const s1 = tick(m, 1000)
  const s2 = tick(m, 1000)
  const s3 = tick(m, 999) // clock went backwards: still after s2
  assert.deepEqual([s1.t, s1.c, s2.t, s2.c, s3.t, s3.c], [1000, 0, 1000, 1, 1000, 2])
  observe(m, { t: 5000, c: 7 })
  const s4 = tick(m, 2000)
  assert.deepEqual([s4.t, s4.c], [5000, 8])
})

test('the upload operation is written with the local commit; a failed local save queues nothing', async () => {
  const server = world()
  const { d } = await device(server)
  await d.sync() // binds this store to the family
  const before = (await d.records.outbox(1000)).length
  d.records.failNext = 2
  const r = await d.engine.startOrResume('chinese', { optional: true })
  assert.equal(r.kind, 'task')
  assert.ok(d.writer.status().warning, 'held in memory with the existing warning')
  assert.equal((await d.records.outbox(1000)).length, before, 'no upload for a change that is not saved locally')
  await d.engine.retrySaves()
  assert.equal(d.writer.status().warning, null)
  const ops = await d.records.outbox(1000)
  assert.equal(ops.length, before + 1)
  assert.ok(ops.at(-1)!.keys.includes('task|t:chinese:2027-03-01:0'))
  assert.deepEqual(ops.at(-1)!.owner, { family_id: FAMILY, child_id: CHILD })
})

test('restart keeps unacknowledged operations; a lost response retries the same operation without duplication', async () => {
  const server = world()
  const { d } = await device(server)
  await d.sync()
  server.offline = true
  await d.practise(2)
  assert.equal((await d.sync()).state, 'offline')
  const queued = await d.outboxIds()
  const payload = JSON.stringify(await d.records.outbox(1000))
  assert.ok(queued.length > 0)
  await d.open() // app restart
  assert.deepEqual(await d.outboxIds(), queued)
  assert.equal(JSON.stringify(await d.records.outbox(1000)), payload)
  server.offline = false
  server.loseNextResponse = true // applied on the server, response lost on the way back
  assert.equal((await d.sync()).state, 'offline')
  assert.deepEqual(await d.outboxIds(), queued, 'unacknowledged operations stay')
  const status = await d.sync()
  assert.equal(status.state, 'idle', JSON.stringify(status))
  assert.equal(status.waiting, 0)
  const events = server.records(CHILD).filter((r) => r.kind === 'answer_event')
  assert.equal(events.length, d.engine.state.events.length)
  assert.equal(new Set(events.map((e) => e.key)).size, events.length)
})

test('an interrupted batch keeps every unacknowledged operation', async () => {
  const server = world()
  const { d } = await device(server)
  await d.sync()
  server.offline = true
  for (let i = 0; i < 70; i++) await d.engine.flush().then(() => d.engine.setX('chinese', 6 + (i % 14)))
  await d.sync()
  const queued = await d.records.outbox(1000)
  assert.ok(queued.length >= 70)
  server.offline = false
  // The first request (50 operations) is applied; the connection drops before the next one.
  let pushes = 0
  const transport = server.transport()
  const push = transport.push
  transport.push = async (...args) => {
    if (++pushes === 2) throw new (await import('../../src/sync/transport.ts')).TransportError('offline', 'network')
    return push(...args)
  }
  const { SyncManager } = await import('../../src/sync/manager.ts')
  const m = new SyncManager({ transport, auth: new TestAuth(session('parent-a', 'token-a')), identity: 'key-parent-a', identityOf: async (u) => `key-${u}`,
    records: d.records, pack: d.pack, engine: d.engine, program: () => d.program, online: () => true, timers: d.syncTimers })
  assert.equal((await m.syncNow('manual')).state, 'offline')
  const left = await d.records.outbox(1000)
  assert.equal(left.length, queued.length - 50)
  assert.deepEqual(left.map((o) => o.op_id), queued.slice(50).map((o) => o.op_id))
  m.dispose()
  assert.equal((await d.sync()).state, 'idle')
  assert.equal(server.records(CHILD).find((r) => r.key === 'x:chinese')!.value!.x, d.engine.xFor('chinese'))
})

test('expired authentication: practice and local saving continue, uploads queue, sync resumes after sign-in', async () => {
  const server = world()
  const { d, auth } = await device(server)
  await d.sync()
  server.expired.add('token-a')
  auth.session = { ...auth.session!, expiresAt: Math.floor(Date.now() / 1000) - 10 }
  await d.practise(2)
  assert.equal(d.writer.status().warning, null, 'saved locally')
  const s = await d.sync()
  assert.equal(s.state, 'sign_in_required')
  assert.ok(s.waiting > 0)
  assert.ok(auth.refreshes >= 1)
  await d.practise(1) // still usable
  // The parent signs in again with the same account.
  server.tokens.set('token-a2', 'parent-a')
  auth.session = session('parent-a', 'token-a2')
  const after = await d.manager.syncNow('sign_in')
  assert.equal(after.state, 'idle', JSON.stringify(after))
  assert.equal(server.records(CHILD).filter((r) => r.kind === 'answer_event').length, 3)
})

test('a token refreshed during sync is used and the run completes', async () => {
  const server = world()
  const { d, auth } = await device(server)
  auth.session = { ...auth.session!, expiresAt: Math.floor(Date.now() / 1000) + 30 } // within the refresh margin
  server.tokens.set('token-r', 'parent-a')
  auth.refreshWith = async () => ({ ok: true, session: session('parent-a', 'token-r') })
  assert.equal((await d.sync()).state, 'idle')
  assert.equal(auth.refreshes, 1)
})

test('sign-out discards responses still in flight; nothing is acknowledged or applied', async () => {
  const server = world()
  const { d } = await device(server)
  await d.sync()
  await d.practise(1)
  const queued = await d.outboxIds()
  let release!: () => void
  server.gate = new Promise((r) => { release = r })
  const running = d.sync()
  d.manager.dispose() // sign-out while the request waits
  release()
  server.gate = null
  await running
  assert.deepEqual(await d.outboxIds(), queued, 'a late acknowledgement was not applied')
})

test('another account cannot sync this working copy, and a different family is refused', async () => {
  const server = world()
  const { d, auth } = await device(server)
  await d.practise(1)
  await d.sync()
  const pushes = server.requests.filter((r) => r.fn === 'push').length
  await d.practise(1)
  auth.session = session('parent-b', 'token-b') // another parent signed in on this device
  const s = await d.sync()
  assert.equal(s.state, 'sign_in_required')
  assert.equal(s.code, 'different_account')
  assert.equal(server.requests.filter((r) => r.fn === 'push').length, pushes, 'nothing uploaded under the other account')
  assert.equal(server.records(OTHER_CHILD).length, 0)
  // A server that now resolves this identity to another family/child is refused, not attached.
  auth.session = session('parent-a', 'token-a')
  server.members.set('parent-a', [{ family_id: OTHER_FAMILY, child_id: OTHER_CHILD }])
  await d.open()
  const refused = await d.sync()
  assert.equal(refused.state, 'failed')
  assert.equal(refused.code, 'binding_mismatch')
  assert.equal(server.records(OTHER_CHILD).length, 0)
})

test('records made before the first sign-in sync are uploaded once, under the verified family', async () => {
  const server = world()
  const { d } = await device(server)
  await d.practise(2)
  assert.equal((await d.records.outbox(100)).length, 0, 'nothing queued before binding')
  assert.equal((await d.sync()).state, 'idle')
  assert.equal(server.records(CHILD).filter((r) => r.kind === 'answer_event').length, 2)
  assert.deepEqual((await d.records.meta()).owner, { family_id: FAMILY, child_id: CHILD })
})

test('the clock is warned about and a far-future stamp is clamped once by the server', async () => {
  const server = world()
  const { d } = await device(server)
  await d.sync()
  server.nowMs = () => d.clock.t - 3_600_000 // the device is an hour fast
  await d.engine.setX('chinese', 9)
  const s = await d.sync()
  assert.equal(s.clockWarning, true)
  const rec = server.records(CHILD).find((r) => r.kind === 'setting' && r.key === 'x:chinese')!
  assert.ok(rec.stamps.value.t <= d.clock.t - 3_600_000 + 300_000)
})

async function practisedDevice(server: FakeSyncServer) {
  const { d } = await device(server)
  await d.program.installPack(invented())
  // Day 1: finish one task (story checkpoint delivered), then start a second, leave it unfinished (pinned).
  await d.practise(undefined, () => false)
  await d.deliverStory()
  d.clock.sgt('2027-03-02')
  await d.practise(3)
  const plan = [...d.program.plans().keys()][0]
  await d.program.recordProduction(plan, 'independent', 'correct')
  await d.engine.setRestDay()
  const s = await d.sync()
  assert.equal(s.state, 'idle', JSON.stringify(s))
  return d
}

test('a fresh device restores records and the pack (no wrong forms); corrective practice and the pinned task resume', async () => {
  const server = world()
  const a = await practisedDevice(server)
  const clock = new Clock(a.clock.now())
  const { d: b } = await device(server, { clock })
  const s = await b.sync()
  assert.equal(s.state, 'idle', JSON.stringify(s))
  // Learning records match exactly; derived progress is recomputed to the same values.
  const strip = (st: typeof a.engine.state) => ({ ...st, next_seq: 0 })
  assert.deepEqual(sortById(b.engine.state.events), sortById(a.engine.state.events))
  assert.deepEqual(strip(b.engine.state).tasks.map((t) => ({ ...t, target_aggregates: [] })), a.engine.state.tasks.map((t) => ({ ...t, target_aggregates: [] })))
  assert.deepEqual(sortById(b.engine.state.presentations), sortById(a.engine.state.presentations))
  assert.deepEqual(sortById(b.engine.state.targets), sortById(a.engine.state.targets))
  assert.deepEqual(b.engine.state.completions, a.engine.state.completions)
  assert.deepEqual(b.engine.state.story, a.engine.state.story)
  assert.deepEqual(b.engine.state.settings, a.engine.state.settings)
  assert.deepEqual(b.engine.state.rest_days, a.engine.state.rest_days)
  const progress = (e: typeof a.engine) => JSON.stringify([...e.derived().progress.entries()].map(([k, v]) => [k, v.stage, v.dueOn, v.notBefore]).sort())
  assert.equal(progress(b.engine), progress(a.engine))
  // The pack and its links are back, without wrong forms; production evidence is back.
  const restored = (await b.pack.packs())[0]
  assert.equal(restored.pack_id, 'test-pack-1')
  assert.ok(restored.register.cases.every((c) => c.observed === undefined))
  assert.deepEqual(await b.pack.crosswalk(), await a.pack.crosswalk())
  assert.deepEqual(sortById(await b.pack.production()), sortById(await a.pack.production()))
  assert.ok(b.program.report()!.cases.every((r) => r.observed === null))
  // The unfinished task pinned to the private build resumes on the same presentation.
  const open = b.engine.openTask('chinese')!
  assert.equal(open.id, a.engine.openTask('chinese')!.id)
  const next = await b.engine.next(open.id)
  assert.equal(next.kind, 'question')
  const aNext = await a.engine.next(open.id)
  assert.equal(next.kind === 'question' && aNext.kind === 'question' && next.presentation.id, aNext.kind === 'question' && aNext.presentation.id)
  // Corrective practice works from the correct targets on the restored device.
  b.clock.sgt('2027-03-04')
  assert.ok((await b.practise())?.done)
  assert.ok((await b.practise())?.done)
  const before = new Set(a.engine.state.presentations.map((p) => p.id))
  const madeOnB = b.engine.state.presentations.filter((p) => !before.has(p.id))
  assert.ok(madeOnB.some((p) => p.target_ref?.startsWith('case-target:') && p.role === 'repair'), 'case repair is scheduled from the correct targets')
})

test('daily credit and delivered story checkpoints are not duplicated by retry or replay', async () => {
  const server = world()
  const a = await practisedDevice(server)
  const completions = a.engine.state.completions.length
  const delivered = a.engine.state.story.checkpoints.filter((c) => c.state === 'delivered').length
  // Replay every upload again (duplicates) and restore twice on fresh devices.
  for (const op of [...server.requests]) {
    if (op.fn !== 'push') continue
    const r = await server.transport().push('token-a', CHILD, JSON.parse(op.body), new AbortController().signal)
    assert.ok(r.results.every((x) => x.status === 'duplicate'))
  }
  for (let i = 0; i < 2; i++) {
    const { d: b } = await device(server, { clock: new Clock(a.clock.now()) })
    assert.equal((await b.sync()).state, 'idle')
    assert.equal(b.engine.state.completions.length, completions)
    assert.equal(b.engine.state.story.checkpoints.filter((c) => c.state === 'delivered').length, delivered)
    assert.equal(b.engine.pendingCheckpoints().length, a.engine.pendingCheckpoints().length)
  }
  assert.equal(server.records(CHILD).filter((r) => r.kind === 'completion').length, completions)
})

test('an interrupted restore resumes; incompatible data stops with a clear code and keeps local records', async () => {
  const server = world()
  const a = await practisedDevice(server)
  // Interrupted: the first page arrives, then the connection drops.
  const { d: b } = await device(server, { clock: new Clock(a.clock.now()) })
  const transport = server.transport()
  let pulls = 0
  const pull = transport.pull
  transport.pull = async (t, c, cursor, _limit, sig) => {
    if (++pulls === 2) throw new (await import('../../src/sync/transport.ts')).TransportError('offline', 'network')
    return pull(t, c, cursor, 20, sig)
  }
  const { SyncManager } = await import('../../src/sync/manager.ts')
  const m = new SyncManager({ transport, auth: new TestAuth(session('parent-a', 'token-a')), identity: 'key-parent-a', identityOf: async (u) => `key-${u}`,
    records: b.records, pack: b.pack, engine: b.engine, program: () => b.program, online: () => true, timers: b.syncTimers })
  assert.equal((await m.syncNow('manual')).state, 'offline')
  m.dispose()
  const meta = await b.records.meta()
  assert.equal(meta.recovery?.done, false)
  assert.equal(meta.recovery?.cursor, 20)
  assert.equal(b.engine.state.events.length, 0, 'nothing applied from a partial download')
  // Incompatible pack data on the server: restore stops, staging and local records are kept.
  const rec = server.records(CHILD).find((r) => r.kind === 'pack_version')!
  const saved = structuredClone(rec.value)
  ;(rec.value as { pack: { register: { cases: { route: unknown }[] } } }).pack.register.cases[0].route = { mode: 'objective' }
  await b.open()
  const failed = await b.sync()
  assert.equal(failed.state, 'failed')
  assert.equal(failed.code, 'restore_incompatible')
  assert.equal(b.engine.state.events.length, 0)
  assert.equal((await b.records.meta()).recovery?.done, false)
  rec.value = saved
  const ok = await b.sync()
  assert.equal(ok.state, 'idle', JSON.stringify(ok))
  assert.equal(b.engine.state.events.length, a.engine.state.events.length)
  assert.equal((await b.records.staged()).length, 0)
})

test('deletions reach the device as tombstones (case links removed by a newer pack)', async () => {
  const server = world()
  const { d: a } = await device(server)
  await a.program.installPack(invented({ extraCase: true }))
  await a.sync()
  const { d: b } = await device(server, { clock: new Clock(a.clock.now()) })
  await b.sync()
  assert.ok((await b.pack.crosswalk()).some((r) => r.case_id === 'O907'))
  await a.program.installPack(invented())
  assert.equal((await a.sync()).state, 'idle')
  const tomb = server.records(CHILD).find((r) => r.kind === 'case_link' && r.key === 'O907')!
  assert.equal(tomb.deleted, true)
  assert.equal((await b.sync()).state, 'idle')
  assert.ok(!(await b.pack.crosswalk()).some((r) => r.case_id === 'O907'))
  assert.equal((await b.pack.packs())[0].pack_id, 'test-pack-1', 'the newer active pack reached the other device')
})

test('editable values keep the replaced value in server history; add-only events are never overwritten', async () => {
  const server = world()
  const { d } = await device(server)
  await d.sync()
  await d.engine.setX('chinese', 8)
  await d.sync()
  await d.engine.setX('chinese', 14)
  await d.sync()
  const hist = server.history(CHILD).filter((h) => h.key === 'x:chinese')
  assert.equal(hist.length, 1)
  assert.equal((hist[0].replaced as { x: number }).x, 8)
  // A forged second version of an existing answer event (same id, different content) does not replace it.
  await d.practise(1)
  await d.sync()
  const ev = server.records(CHILD).find((r) => r.kind === 'answer_event')!
  const forged = structuredClone(ev.value) as Record<string, unknown>
  forged.correct = !forged.correct
  const op = { op_id: crypto.randomUUID(), device_id: crypto.randomUUID(), device_seq: 1, stamp: { t: Date.now(), c: 0, d: '' }, changes: [{ kind: 'answer_event' as const, key: ev.key, value: forged }] }
  op.stamp.d = op.device_id
  const r = await server.transport().push('token-a', CHILD, [op], new AbortController().signal)
  assert.equal(r.results[0].status, 'applied')
  assert.notEqual((server.records(CHILD).find((x) => x.key === ev.key)!.value as { correct: boolean }).correct, forged.correct)
})

test('the transport deadline also aborts a stalled response body', { timeout: 2_000 }, async () => {
  const { createTransport, TransportError } = await import('../../src/sync/transport.ts')
  const transport = createTransport({ url: 'https://synthetic.example.invalid', anonKey: 'synthetic-only' }, {
    timeoutMs: 20,
    fetch: async (_input, init) => new Response(new ReadableStream({
      start(controller) {
        // Headers arrive immediately but the response body never finishes, as on a stalled connection.
        init?.signal?.addEventListener('abort', () => controller.error(new DOMException('Synthetic abort', 'AbortError')))
      },
    }), { headers: { 'Content-Type': 'application/json' } }),
  })
  await assert.rejects(transport.whoami('synthetic-token', new AbortController().signal),
    (e: unknown) => e instanceof TransportError && e.kind === 'timeout')
})

test('records first synced without the pack store get the pack once the pack store is added', async () => {
  const server = world()
  const { d: a } = await device(server)
  await a.program.installPack(invented())
  assert.equal((await a.sync()).state, 'idle')
  // A build without the pack store syncs this device's records first; its checkpoint passes the pack records.
  const records = new MemorySyncRecordStore()
  const { d: b } = await device(server, { clock: new Clock(a.clock.now()), records })
  b.manager.dispose()
  const recordsOnly = new SyncManager({ transport: server.transport(), auth: new TestAuth(session('parent-a', 'token-a')), identity: 'key-parent-a',
    identityOf: async (u) => `key-${u}`, records, pack: null, engine: b.engine, online: () => true, timers: b.syncTimers })
  assert.equal((await recordsOnly.syncNow('manual')).state, 'idle')
  recordsOnly.dispose()
  // The same local records, now with the pack store.
  const { d: later } = await device(server, { clock: new Clock(a.clock.now()), records, pack: new MemorySyncPrivateStore() })
  assert.equal((await later.sync()).state, 'idle')
  const pack = (await later.pack.packs())[0]
  assert.equal(pack?.pack_id, 'test-pack-1')
  assert.ok(pack.register.cases.every((c) => c.observed === undefined))
  assert.deepEqual(await later.pack.crosswalk(), await a.pack.crosswalk())
  assert.equal(later.engine.state.events.length, a.engine.state.events.length)
})

for (const failure of [
  { step: 'download_apply', name: 'TypeError', expected: 'type_error' },
  { step: 'download_cursor', name: 'TransactionInactiveError', expected: 'transaction_inactive' },
  { step: 'sync_complete', name: 'QuotaExceededError', expected: 'quota_exceeded' },
  { step: 'download_apply', name: 'private_answer_payload_must_not_escape', expected: 'unexpected' },
]) {
  test(`unexpected ${failure.step} failure reports a safe category and preserves uploaded answers for retry`, async () => {
    const server = world()
    const { d } = await device(server)
    assert.equal((await d.sync()).state, 'idle')
    await d.practise(1)
    const lastSuccess = (await d.records.meta()).last_sync_at
    d.clock.advance(30)
    const error = Object.assign(Object.create(null), { name: failure.name, message: 'private_answer_payload_must_not_escape' })
    const owner = failure.step === 'download_apply' ? d.engine : d.records
    const key = failure.step === 'download_apply' ? 'applyRemote' : failure.step === 'download_cursor' ? 'setCursor' : 'setLastSync'
    const obj = owner as unknown as Record<string, (...args: unknown[]) => unknown>
    const original = obj[key]
    obj[key] = async () => { throw error }
    const failed = await d.sync()
    assert.equal(failed.state, 'failed')
    assert.equal(failed.code, `${failure.step}:${failure.expected}`)
    assert.equal(failed.lastSyncAt, lastSuccess, 'a failed run cannot advance last success')
    assert.equal(failed.waiting, 0, 'upload was already acknowledged before this failure')
    assert.equal(server.records(CHILD).filter((r) => r.kind === 'answer_event').length, 1)
    assert.ok(!JSON.stringify(failed).includes(error.message))
    obj[key] = original
    assert.equal((await d.sync()).state, 'idle')
    assert.equal(server.records(CHILD).filter((r) => r.kind === 'answer_event').length, 1, 'retry cannot duplicate the answer')
    d.manager.dispose()
  })
}

test('F51: parent amendments made on two devices are both kept, reach every device and replay to the same progress', async () => {
  const server = world()
  const a = await practisedDevice(server)
  const { d: b } = await device(server, { clock: new Clock(a.clock.now()) })
  assert.equal((await b.sync()).state, 'idle')
  const credit = (d: Device) => JSON.stringify({ completions: d.engine.state.completions, delivered: d.engine.state.story.checkpoints.filter((c) => c.state === 'delivered') })
  const kept = credit(a)
  assert.equal(credit(b), kept)
  const amended = 'case-target:zh.p2_higher_chinese.char.u4f4f'
  const invalid = 'case-target:zh.p2_higher_chinese.char.u5ea7'
  const original = structuredClone(a.engine.state.targets.find((t) => t.id === amended))
  assert.ok(original && b.engine.state.targets.some((t) => t.id === invalid))
  // Both devices change targets while disconnected from each other.
  const { id: replacement } = await a.engine.amendTarget(amended, { error_type: 'form_confusion' }, 'wrong_error_type')
  await b.engine.invalidateTarget(invalid, 'not_a_mistake')
  const answered = b.engine.state.presentations.find((p) => p.status !== 'invalidated' && p.status !== 'flagged_replaced'
    && b.engine.state.tasks.find((t) => t.id === p.task_id)?.status === 'finalised' && b.engine.state.events.some((e) => e.presentation_id === p.id && e.phase === 'first'))
  assert.ok(answered)
  await b.engine.invalidatePresentation(answered.id, 'not_a_mistake')
  for (const d of [a, b, a]) assert.equal((await d.sync()).state, 'idle')
  // Every amendment reaches both devices; originals stay as they were on the server; progress converges.
  const kinds = (d: Device) => d.engine.state.amendments.map((x) => `${x.kind}:${x.refs.join('+')}`).sort()
  assert.deepEqual(kinds(a), kinds(b))
  assert.equal(kinds(a).length, 3)
  const serverTarget = server.records(CHILD).find((r) => r.kind === 'target' && r.key === amended)!.value
  assert.deepEqual(serverTarget, original)
  assert.ok(server.records(CHILD).some((r) => r.kind === 'target' && r.key === replacement))
  assert.equal(server.records(CHILD).find((r) => r.kind === 'presentation' && r.key === answered.id)!.value.status, 'invalidated')
  const progress = (d: Device) => JSON.stringify([...d.engine.derived().progress.entries()].map(([k, v]) => [k, v.stage, v.dueOn, v.notBefore, v.clearances]).sort())
  assert.equal(progress(a), progress(b))
  for (const d of [a, b]) {
    const p = d.engine.derived().progress
    assert.equal(p.has(amended), false)
    assert.equal(p.has(invalid), false)
    assert.equal(p.get(replacement)?.stage, 'exact')
    assert.equal(credit(d), kept, 'past completions and delivered story are retained')
    // The case report follows the amendment: the amended case lives on its replacement, the invalidated ones say so.
    const rows = new Map(d.program.report()!.cases.map((r) => [r.case_id, r]))
    assert.equal(rows.get('O903')!.status, 'not_yet_evidenced')
    assert.equal(rows.get('O901')!.status, 'invalidated')
    assert.equal(rows.get('O902')!.status, 'invalidated')
  }
  // Re-importing the register (as every open does) neither resurrects nor duplicates the corrected cases.
  const before = JSON.stringify(b.engine.state.targets)
  await b.program.importRegister()
  assert.equal(JSON.stringify(b.engine.state.targets), before)
  // A later pack with a new case on the amended point joins the replacement, not the superseded original.
  await a.program.installPack(invented({ extraCase: true }))
  assert.ok(a.engine.state.targets.find((t) => t.id === replacement)!.observations.some((o) => o.id === 'case:o907'))
  assert.ok(!a.engine.state.targets.find((t) => t.id === amended)!.observations.some((o) => o.id === 'case:o907'))
})
