// The client's own sync code (transport, auth client, sync manager, local stores, engine and pack programme)
// against the real PostgreSQL server functions, through supabase/tests/sync_server.py. Run by test_sync.py.
// Synthetic learner records and an invented pack only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAuthClient, type KeyValueStore } from '../../../src/auth/client.ts'
import { createTransport, TransportError } from '../../../src/sync/transport.ts'
import type { PrivatePack } from '../../../src/mistakes/pack.ts'
import { buildChineseContent, poolSizes } from '../../../src/catalogue/chinese.ts'
import { Device } from '../../../tests/engine/sync-harness.ts'
import { Clock } from '../../../tests/engine/helpers.ts'
import { syntheticPack } from '../../../tests/engine/fixtures/private-pack.ts'
import { publicChinese } from '../../../tests/engine/fixtures/public-chinese.ts'

const url = process.env.SYNC_SERVER_URL ?? ''
const anonKey = process.env.SYNC_ANON_KEY ?? 'synthetic-test-only'
const skip = url === '' ? 'needs SYNC_SERVER_URL (run supabase/tests/test_sync.py)' : false
const config = { url, anonKey }
const WRONG_FORM = '错形哨兵'

const PENDING_REF = (() => {
  const content = publicChinese()
  const built = buildChineseContent({ courses: ['p2_higher_chinese', 'p3_higher_chinese'], ...content })
  return content.lists.characters.find((c) => c.course === 'p2_higher_chinese' && Object.values(poolSizes(built.release, c.id)).every((n) => n === 0))!.id
})()

function invented(): PrivatePack {
  const p = syntheticPack({ pendingRef: PENDING_REF }) as unknown as PrivatePack
  for (const c of p.register.cases) c.observed = WRONG_FORM
  return p
}

const memory = (): KeyValueStore => {
  const m = new Map<string, string>()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }
}

async function control(path: string, body: unknown) {
  const r = await fetch(`${url}/__test/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.json()
}
const sql = async (q: string): Promise<string[][]> => control('sql', { sql: q })
const health = async () => (await (await fetch(`${url}/__test/health`)).json()) as { users: Record<string, string>; children: Record<string, string> }

async function device(email: string, clock?: Clock, transport = createTransport(config)) {
  const auth = createAuthClient({ url, anonKey, googleEnabled: false }, { storage: memory() })
  const r = await auth.signInWithPassword(email, 'synthetic-password')
  assert.ok(r.ok)
  const d = new Device({ transport, auth, userId: r.ok ? r.session.userId : '', clock })
  await d.open()
  return { d, auth, userId: r.ok ? r.session.userId : '' }
}

/** A child with no synced records yet, owned by a fresh synthetic parent (the server provisions it). */
async function freshParent() {
  const h = await health()
  return { email: 'parent-a@example.invalid', child: h.children['parent-a@example.invalid'] }
}

test('practice, pack and production upload and read back from the server unchanged', { skip }, async () => {
  const { child } = await freshParent()
  const { d, auth } = await device('parent-a@example.invalid')
  await d.program.installPack(invented())
  await d.practise(4, (q) => q.presentation.position % 2 === 0)
  const plan = [...d.program.plans().keys()][0]
  await d.program.recordProduction(plan, 'independent', 'correct')
  await d.engine.setX('chinese', 13)
  const s = await d.sync()
  assert.equal(s.state, 'idle', JSON.stringify(s))
  assert.equal(s.waiting, 0)
  // Read back through the same server function a device uses.
  const t = createTransport(config)
  const token = auth.getStoredSession()!.accessToken
  const all = []
  for (let cursor = 0; ;) {
    const page = await t.pull(token, child, cursor, 100, new AbortController().signal)
    all.push(...page.changes)
    cursor = page.cursor
    if (!page.more) break
  }
  const events = all.filter((c) => c.kind === 'answer_event').map((c) => c.value)
  for (const e of d.engine.state.events) assert.deepEqual(events.find((x) => x?.id === e.id), { ...e })
  const task = all.find((c) => c.kind === 'task' && c.key === d.engine.state.tasks[0].id)!.value as Record<string, unknown>
  assert.deepEqual(task.plan, d.engine.state.tasks[0].plan)
  assert.deepEqual(all.find((c) => c.kind === 'setting' && c.key === 'x:chinese')!.value, { x: 13, changed_at: d.engine.state.settings.subjects.find((x) => x.subject === 'chinese')!.changed_at })
  assert.ok(all.some((c) => c.kind === 'production_event'))
  assert.ok(all.some((c) => c.kind === 'pack_version'))
  assert.ok(!JSON.stringify(all).includes(WRONG_FORM))
  const stored = await sql(`select count(*) from public.sync_records where value::text like '%${WRONG_FORM}%' or value::text like '%"observed"%';`)
  assert.equal(stored[0][0], '0')
})

test('a lost response after commit retries the same operation without duplication', { skip }, async () => {
  const { child } = await freshParent()
  const { d } = await device('parent-a@example.invalid')
  await d.sync()
  await d.practise(2)
  const queued = await d.outboxIds()
  await control('lose-next', { count: 1 })
  assert.equal((await d.sync()).state, 'offline')
  assert.deepEqual(await d.outboxIds(), queued)
  const s = await d.sync()
  assert.equal(s.state, 'idle', JSON.stringify(s))
  for (const id of queued) {
    const rows = await sql(`select count(*) from public.sync_receipts where child_id = '${child}' and op_id = '${id}';`)
    assert.equal(rows[0][0], '1')
  }
  const events = d.engine.state.events.map((e) => `'${e.id}'`).join(',')
  const counted = await sql(`select count(*), count(distinct key) from public.sync_records where child_id = '${child}' and kind = 'answer_event' and key in (${events});`)
  assert.deepEqual(counted[0], [String(d.engine.state.events.length), String(d.engine.state.events.length)])
})

test('an expired session keeps practice and local saving; uploads queue and resume after sign-in', { skip }, async () => {
  const { d, auth } = await device('parent-a@example.invalid')
  await d.sync()
  await control('expire', { email: 'parent-a@example.invalid', revoke_refresh: true })
  const session = auth.getStoredSession()!
  ;(auth as unknown as { getStoredSession: () => unknown }).getStoredSession = () => ({ ...session, expiresAt: Math.floor(Date.now() / 1000) - 5 })
  await d.practise(2)
  assert.equal(d.writer.status().warning, null)
  const s = await d.sync()
  assert.equal(s.state, 'sign_in_required', JSON.stringify(s))
  assert.ok(s.waiting > 0)
  delete (auth as unknown as { getStoredSession?: unknown }).getStoredSession
  const again = createAuthClient({ url, anonKey, googleEnabled: false }, { storage: memory() })
  const r = await again.signInWithPassword('parent-a@example.invalid', 'synthetic-password')
  assert.ok(r.ok)
  ;(auth as unknown as { getStoredSession: () => unknown }).getStoredSession = () => (r.ok ? r.session : null)
  const after = await d.manager.syncNow('sign_in')
  assert.equal(after.state, 'idle', JSON.stringify(after))
  assert.equal(after.waiting, 0)
})

test('another account on the device cannot upload this working copy', { skip }, async () => {
  const h = await health()
  const { d } = await device('parent-a@example.invalid')
  await d.sync()
  await d.practise(1)
  const otherAuth = createAuthClient({ url, anonKey, googleEnabled: false }, { storage: memory() })
  assert.ok((await otherAuth.signInWithPassword('parent-b@example.invalid', 'synthetic-password')).ok)
  const before = await sql(`select count(*) from public.sync_records where child_id = '${h.children['parent-b@example.invalid']}';`)
  const m = new (await import('../../../src/sync/manager.ts')).SyncManager({
    transport: createTransport(config), auth: otherAuth, identity: `key-${h.users['parent-a@example.invalid']}`, identityOf: async (u) => `key-${u}`,
    records: d.records, pack: d.pack, engine: d.engine, program: () => d.program, online: () => true, timers: d.syncTimers,
  })
  const s = await m.syncNow('manual')
  assert.equal(s.state, 'sign_in_required')
  assert.equal(s.code, 'different_account')
  const after = await sql(`select count(*) from public.sync_records where child_id = '${h.children['parent-b@example.invalid']}';`)
  assert.deepEqual(after, before)
  assert.ok((await d.records.counts()).pending > 0, 'queued changes stay for the right account')
  m.dispose()
})

test('another family and a spoofed child are refused; malformed uploads are rejected with codes only', { skip }, async () => {
  const h = await health()
  const t = createTransport(config)
  const auth = createAuthClient({ url, anonKey, googleEnabled: false }, { storage: memory() })
  const r = await auth.signInWithPassword('parent-a@example.invalid', 'synthetic-password')
  assert.ok(r.ok)
  const token = r.ok ? r.session.accessToken : ''
  const signal = new AbortController().signal
  const device = crypto.randomUUID()
  const op = { op_id: crypto.randomUUID(), device_id: device, device_seq: 1, stamp: { t: Date.now(), c: 0, d: device }, changes: [{ kind: 'setting' as const, key: 'timezone', value: { timezone: 'Asia/Singapore' } }] }
  for (const child of [h.children['parent-b@example.invalid'], crypto.randomUUID()]) {
    await assert.rejects(t.push(token, child, [op], signal), (e: unknown) => e instanceof TransportError && e.kind === 'forbidden')
    await assert.rejects(t.pull(token, child, 0, 10, signal), (e: unknown) => e instanceof TransportError && e.kind === 'forbidden')
  }
  await assert.rejects(t.push('not-a-token', h.children['parent-a@example.invalid'], [op], signal), (e: unknown) => e instanceof TransportError && e.kind === 'unauthorized')
  await assert.rejects(t.push(anonKey, h.children['parent-a@example.invalid'], [op], signal), (e: unknown) => e instanceof TransportError && e.kind === 'unauthorized')
  const bad = { ...op, op_id: crypto.randomUUID(), device_seq: 2, changes: [{ kind: 'setting' as const, key: 'timezone', value: { timezone: 'Asia/Singapore', note: WRONG_FORM } }] }
  const res = await t.push(token, h.children['parent-a@example.invalid'], [bad as never], signal)
  assert.deepEqual(res.results, [{ op_id: bad.op_id, status: 'rejected', code: 'invalid_change' }])
  assert.ok(!JSON.stringify(res).includes(WRONG_FORM))
  await assert.rejects(t.push(token, h.children['parent-a@example.invalid'], [], signal), (e: unknown) => e instanceof TransportError && e.kind === 'rejected' && e.code === 'invalid_request')
})

test('a reset device restores records and the pack without wrong forms; the pinned task and corrective practice resume', { skip }, async () => {
  const clock = new Clock('2027-04-01T09:00:00+08:00')
  const { d: a } = await device('parent-a@example.invalid', clock)
  await a.sync()
  await a.program.installPack(invented())
  a.clock.sgt('2027-04-02')
  await a.practise(undefined, () => false)
  await a.deliverStory()
  a.clock.sgt('2027-04-03')
  await a.practise(3)
  assert.equal((await a.sync()).state, 'idle')
  // A wiped device: empty local stores, same parent account.
  const { d: b } = await device('parent-a@example.invalid', new Clock(a.clock.now()))
  const s = await b.sync()
  assert.equal(s.state, 'idle', JSON.stringify(s))
  const ids = (xs: { id: string }[]) => xs.map((x) => x.id).sort()
  for (const e of a.engine.state.events) assert.deepEqual(b.engine.state.events.find((x) => x.id === e.id), e)
  assert.ok(ids(a.engine.state.tasks).every((id) => ids(b.engine.state.tasks).includes(id)))
  assert.deepEqual(b.engine.state.story.checkpoints.filter((c) => a.engine.state.story.checkpoints.some((x) => x.id === c.id)),
    a.engine.state.story.checkpoints)
  for (const c of a.engine.state.completions) assert.equal(b.engine.state.completions.filter((x) => x.task_id === c.task_id && x.local_date === c.local_date).length, 1)
  const pack = (await b.pack.packs())[0]
  assert.equal(pack.pack_id, 'test-pack-1')
  assert.ok(pack.register.cases.every((c) => c.observed === undefined))
  const open = a.engine.openTask('chinese')!
  const nb = await b.engine.next(open.id)
  const na = await a.engine.next(open.id)
  assert.ok(nb.kind === 'question' && na.kind === 'question' && nb.presentation.id === na.presentation.id)
  b.clock.sgt('2027-04-05')
  assert.ok((await b.practise())?.done)
  assert.ok((await b.practise())?.done)
  assert.ok(b.engine.state.presentations.some((p) => p.role === 'repair' && p.target_ref?.startsWith('case-target:') && !a.engine.state.presentations.some((x) => x.id === p.id)))
  assert.equal((await b.sync()).state, 'idle')
})

test('parent amendments on two devices reach the real server as add-only records and both devices replay alike', { skip }, async () => {
  const { child } = await freshParent()
  const clock = new Clock('2027-03-01T09:00:00+08:00')
  const { d: a } = await device('parent-a@example.invalid', clock)
  await a.program.installPack(invented())
  await a.practise(undefined, () => false)
  await a.deliverStory()
  assert.equal((await a.sync()).state, 'idle')
  const { d: b } = await device('parent-a@example.invalid', new Clock(clock.now()))
  assert.equal((await b.sync()).state, 'idle')
  // Arrival order of records differs per device; the credit itself must not.
  const byKey = <T,>(xs: T[]) => xs.map((x) => JSON.stringify(x)).sort()
  const credit = (d: Device) => JSON.stringify({ c: byKey(d.engine.state.completions), s: byKey(d.engine.state.story.checkpoints.filter((x) => x.state === 'delivered')) })
  const kept = credit(a)
  const amended = 'case-target:zh.p2_higher_chinese.char.u4f4f'
  const invalid = 'case-target:zh.p2_higher_chinese.char.u5ea7'
  const { id: replacement } = await a.engine.amendTarget(amended, { error_type: 'form_confusion' }, 'wrong_error_type')
  await b.engine.invalidateTarget(invalid, 'not_a_mistake')
  const answered = b.engine.state.presentations.find((p) => p.status === 'corrected' || p.status === 'answered')!
  await b.engine.invalidatePresentation(answered.id, 'not_a_mistake')
  // An observation-level amendment refers to an observation id, not a record key; it must still sync.
  const sound = 'case-target:zh.p2_higher_chinese.skill.synthetic-sound'
  await b.engine.invalidateObservation(sound, 'case:o904', 'not_a_mistake')
  for (const d of [a, b, a]) assert.equal((await d.sync()).state, 'idle')
  const rows = await sql(`select kind, key, value::text from public.sync_records where child_id = '${child}' and kind in ('target', 'amendment', 'presentation');`)
  const value = (kind: string, key: string) => JSON.parse(rows.find((r) => r[0] === kind && r[1] === key)![2])
  assert.equal(value('target', amended).status, 'active', 'the corrected original is kept as it was')
  assert.equal(value('target', amended).error_type, 'unknown_cause')
  assert.equal(value('target', replacement).replaces, amended)
  assert.equal(value('presentation', answered.id).status, 'invalidated')
  assert.equal(rows.filter((r) => r[0] === 'amendment').length, 4)
  const progress = (d: Device) => JSON.stringify([...d.engine.derived().progress.entries()].map(([k, v]) => [k, v.stage, v.dueOn, v.notBefore]).sort())
  assert.equal(progress(a), progress(b))
  for (const d of [a, b]) {
    assert.equal(d.engine.derived().progress.has(amended), false)
    assert.equal(d.engine.derived().progress.has(invalid), false)
    assert.equal(d.engine.derived().progress.has(sound), false, 'its only observation no longer counts')
    assert.equal(d.engine.derived().progress.get(replacement)?.stage, 'exact')
    assert.equal(credit(d), kept)
  }
})

test('two offline devices against the real server: one schedule per mistake, concurrent edits, a lost acknowledgement and a restart converge', { skip }, async () => {
  const { child } = await freshParent()
  const { d: a } = await device('parent-a@example.invalid', new Clock('2027-04-10T09:00:00+08:00'))
  assert.equal((await a.sync()).state, 'idle')
  // B's connection can be cut: requests then fail before they reach the server (a controlled disconnect).
  const real = createTransport(config)
  let down = false
  const cut = <T,>(fn: () => Promise<T>) => (down ? Promise.reject(new TransportError('offline', 'network')) : fn())
  const switchable: typeof real = {
    whoami: (t, s) => cut(() => real.whoami(t, s)),
    push: (t, c, ops, s) => cut(() => real.push(t, c, ops, s)),
    pull: (t, c, cur, lim, s) => cut(() => real.pull(t, c, cur, lim, s)),
  }
  const { d: b } = await device('parent-a@example.invalid', new Clock('2027-04-10T09:00:00+08:00'), switchable)
  assert.equal((await b.sync()).state, 'idle')
  // Offline on both: the same opening mistakes, conflicting settings and different packs.
  await a.practise(2, () => false)
  await b.practise(2, () => false)
  await a.engine.setX('chinese', 12)
  await b.engine.setX('chinese', 16)
  await a.program.installPack(invented())
  b.clock.advance(60)
  await b.program.installPack(syntheticPack({ pendingRef: PENDING_REF, extraCase: true }) as unknown as PrivatePack)
  // B's connection drops before its upload reaches the server: nothing is lost, and nothing reaches the server.
  down = true
  const waiting = await b.outboxIds()
  assert.equal((await b.sync()).state, 'offline')
  assert.deepEqual(await b.outboxIds(), waiting)
  const sent = await sql(`select count(*) from public.sync_receipts where child_id = '${child}' and op_id in (${waiting.map((id) => `'${id}'`).join(',')});`)
  assert.equal(sent[0][0], '0')
  down = false
  // A's upload commits on the server but the response is lost; A restarts before retrying.
  const queued = await a.outboxIds()
  await control('lose-next', { count: 1 })
  assert.notEqual((await a.sync()).state, 'idle')
  assert.deepEqual(await a.outboxIds(), queued, 'nothing is dropped')
  await a.open()
  for (let round = 0, quiet = 0; quiet < 2; round++) {
    assert.ok(round < 8, 'devices settle')
    const s = [await a.sync(), await b.sync()]
    quiet = s.every((x) => x.state === 'idle' && x.waiting === 0) ? quiet + 1 : 0
  }
  for (const id of queued) {
    const rows = await sql(`select count(*) from public.sync_receipts where child_id = '${child}' and op_id = '${id}';`)
    assert.equal(rows[0][0], '1', 'each operation applied once')
  }
  const sortById = <T extends { id: string }>(xs: T[]) => [...xs].sort((x, y) => x.id.localeCompare(y.id))
  assert.deepEqual(sortById(a.engine.state.events), sortById(b.engine.state.events))
  assert.equal(a.engine.xFor('chinese'), b.engine.xFor('chinese'))
  const keys = (d: Device) => [...d.engine.derived().progress.values()].map((v) => `${v.target.knowledge_point_ref}|${v.target.error_type}`).sort()
  assert.deepEqual(keys(a), [...new Set(keys(a))], 'one schedule per mistake')
  assert.deepEqual(keys(a), keys(b))
  const progress = (d: Device) => JSON.stringify([...d.engine.derived().progress.values()].map((v) => [v.target.id, v.stage, v.dueOn, v.notBefore]).sort())
  assert.equal(progress(a), progress(b))
  const replaced = await sql(`select count(*) from public.sync_field_history where child_id = '${child}' and key = 'x:chinese';`)
  assert.ok(Number(replaced[0][0]) >= 1, 'the losing X is kept in server history')
  // Both packs' loads converge on one active pack (rule 6).
  assert.deepEqual((await a.pack.packs()).map((p) => p.pack_id), (await b.pack.packs()).map((p) => p.pack_id))
  // Both finish the shared task offline: the day is credited once and delivered story is kept.
  await a.practise()
  await b.practise()
  await a.deliverStory()
  await b.deliverStory()
  for (let round = 0, quiet = 0; quiet < 2; round++) {
    assert.ok(round < 8, 'devices settle')
    const s = [await a.sync(), await b.sync()]
    quiet = s.every((x) => x.state === 'idle' && x.waiting === 0) ? quiet + 1 : 0
  }
  const shared = a.engine.state.tasks.find((t) => t.local_date === '2027-04-10' && t.id.endsWith(':0'))!
  for (const d of [a, b]) assert.equal(d.engine.state.completions.filter((c) => c.task_id === shared.id).length, 1)
  const credit = (d: Device) => JSON.stringify({ c: d.engine.state.completions.map((c) => JSON.stringify(c)).sort(),
    s: d.engine.state.story.checkpoints.filter((c) => c.state === 'delivered').map((c) => c.id).sort() })
  assert.equal(credit(a), credit(b))
  assert.equal(progress(a), progress(b))
})

test('real server: "not a mistake" decided on one device before syncing ends the other device’s record of the same mistake', { skip }, async () => {
  const { d: a } = await device('parent-a@example.invalid', new Clock('2027-05-03T09:00:00+08:00'))
  assert.equal((await a.sync()).state, 'idle')
  const { d: b } = await device('parent-a@example.invalid', new Clock('2027-05-03T09:00:00+08:00'))
  assert.equal((await b.sync()).state, 'idle')
  // Several wrong answers: earlier tests left repair targets on this shared child, and repair answers are not banked.
  await a.practise(6, () => false)
  await b.practise(6, () => false)
  const keyOf = (v: { target: { knowledge_point_ref: string | null; error_type: string } }) => `${v.target.knowledge_point_ref}|${v.target.error_type}`
  // A mistake both devices caught today, each under its own record.
  const today = (d: Device) => d.engine.state.targets.filter((t) => t.observations.some((o) => o.source_type === 'app_practice' && o.observed_on === '2027-05-03'))
  const onB = new Map(today(b).map((t) => [keyOf({ target: t }), t.id]))
  const shared = today(a).find((t) => onB.has(keyOf({ target: t })) && onB.get(keyOf({ target: t })) !== t.id)
  assert.ok(shared, 'both devices recorded the same mistake under different records')
  const first = { target: shared }
  await a.engine.invalidateTarget(first.target.id, 'not_a_mistake')
  for (let round = 0, quiet = 0; quiet < 2; round++) {
    assert.ok(round < 8, 'devices settle')
    const s = [await a.sync(), await b.sync()]
    quiet = s.every((x) => x.state === 'idle' && x.waiting === 0) ? quiet + 1 : 0
  }
  for (const d of [a, b]) assert.ok(![...d.engine.derived().progress.values()].some((v) => keyOf(v) === keyOf(first)))
})
