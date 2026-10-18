// End-to-end mistake route on the real public Chinese content with a SYNTHETIC private pack:
// accepted case → import → prioritised practice → partial progress → restart/resume → stage advancement →
// delayed recheck → per-case report → private export. Synthetic cases only; no learner records.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CatalogueRegistry } from '../../src/catalogue/adapter.ts'
import { poolSizes } from '../../src/catalogue/chinese.ts'
import { LearningEngine, type Step } from '../../src/engine/engine.ts'
import { MemoryRecordStore, WriteQueue } from '../../src/engine/persistence.ts'
import { importTargetId } from '../../src/mistakes/intake.ts'
import { MemoryPrivateStore, MistakeProgram } from '../../src/mistakes/program.ts'
import { Clock, ids, ManualTimers, correctResponse, wrongResponse } from './helpers.ts'
import { publicChinese } from './fixtures/public-chinese.ts'
import { PRIVATE_REF, syntheticPack } from './fixtures/private-pack.ts'

type Q = Extract<Step, { kind: 'question' }>

async function setup() {
  const clock = new Clock('2027-03-01T09:00:00+08:00')
  const registry = new CatalogueRegistry()
  const store = new MemoryRecordStore()
  const timers = new ManualTimers()
  const newId = ids()
  const engine = LearningEngine.fresh('Asia/Singapore', { registry, now: clock.now, newId, writer: new WriteQueue(store, timers) })
  await engine.setX('chinese', 10)
  const privateStore = new MemoryPrivateStore()
  const publicContent = publicChinese()
  const program = await MistakeProgram.open({ engine, registry, publicContent, store: privateStore, now: clock.now, newId })
  // A grade-list target with no pool in the public bank: imports as pending content.
  const release = registry.current('chinese')!
  const pendingRef = publicContent.lists.characters.find((c) => c.course === 'p2_higher_chinese'
    && Object.values(poolSizes(release, c.id)).every((n) => n === 0))!.id
  return { clock, registry, store, timers, newId, engine, privateStore, publicContent, program, pendingRef }
}

type S = Awaited<ReturnType<typeof setup>>

async function reopen(s: S) {
  const engine = await LearningEngine.load(s.store, 'Asia/Singapore', { registry: s.registry, now: s.clock.now, newId: s.newId, writer: new WriteQueue(s.store, s.timers) })
  const program = await MistakeProgram.open({ engine, registry: new CatalogueRegistry(), publicContent: s.publicContent, store: s.privateStore, now: s.clock.now, newId: s.newId })
  return { engine, program }
}

/** Answer a whole task. `decide` returns true for an independent correct first answer. */
async function run(engine: LearningEngine, taskId: string, decide: (q: Q) => boolean, seen: Q[] = []) {
  for (let i = 0; i < 400; i++) {
    const step = await engine.next(taskId)
    if (step.kind === 'done') return { done: step, seen }
    if (step.kind !== 'question') throw new Error('unexpected teaching')
    if (step.awaiting === 'first') {
      seen.push(step)
      await engine.answer(step.presentation.id, decide(step) ? correctResponse(step.item) : wrongResponse(step.item))
    } else if (step.awaiting === 'retry') await engine.retry(step.presentation.id, correctResponse(step.item))
    else await engine.correct(step.presentation.id, correctResponse(step.item))
  }
  throw new Error('task did not finish')
}

const target = (ref: string) => importTargetId(ref)
const ZUO = 'zh.p2_higher_chinese.char.u5ea7'
const ZHU = 'zh.p2_higher_chinese.char.u4f4f'

test('import is idempotent, shares evidence and keeps pending content out of planning', async () => {
  const s = await setup()
  const r1 = await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  assert.equal(r1.added_targets, 4)
  assert.equal(r1.added_observations, 5)
  assert.deepEqual(r1.pending.map((p) => p.target_ref), [s.pendingRef])
  const zuo = s.engine.state.targets.find((t) => t.id === target(ZUO))!
  assert.equal(zuo.observations.length, 2) // two cases, one target
  assert.equal(s.engine.state.targets.find((t) => t.id === target(s.pendingRef))!.mapping_status, 'pending_content')
  // Same pack again: nothing new.
  const r2 = await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  assert.equal(r2.added_targets + r2.added_observations, 0)
  assert.equal(s.engine.state.targets.length, 4)
  // A later pack with one more case on an existing target adds one observation, no target.
  const r3 = await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef, extraCase: true }))
  assert.equal(r3.added_targets, 0)
  assert.equal(r3.added_observations, 1)
  const rows = new Map(s.program.crosswalk.map((r) => [r.case_id, r]))
  assert.deepEqual(rows.get('O901')!.shared_with, ['O902'])
  assert.equal(rows.get('O906')!.mode, 'external')
  assert.equal(rows.get('O906')!.engine_target_id, null)
  const report = s.program.report()!
  assert.equal(report.cases.length, 7)
  assert.equal(report.totals.pending_content, 1)
  assert.deepEqual(report.expansion_queue.map((q) => q.target_ref), [s.pendingRef])
  // Nothing practised yet: honest "not yet evidenced", never a stage claim from attempts.
  for (const c of report.cases.filter((c) => c.recognition && c.status !== 'pending_content')) assert.equal(c.status, 'not_yet_evidenced')
})

test('imported mistakes wait until the next day, then come before general practice', async () => {
  const s = await setup()
  await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  const t0 = await s.engine.startOrResume('chinese')
  assert.equal(t0.kind, 'task')
  if (t0.kind !== 'task') return
  assert.ok(t0.task.plan.slots.every((x) => x.role === 'material_question' || x.role === 'general_practice'), 'not eligible on import day')
  await run(s.engine, t0.task.id, () => true)
  s.clock.sgt('2027-03-02')
  const t1 = await s.engine.startOrResume('chinese')
  if (t1.kind !== 'task') throw new Error('no task')
  const roles = t1.task.plan.slots.map((x) => x.role)
  const repairTargets = new Set(t1.task.plan.slots.filter((x) => x.role === 'repair').map((x) => x.target_ref))
  for (const ref of [ZUO, ZHU, PRIVATE_REF]) assert.ok(repairTargets.has(target(ref)), `${ref} planned`)
  assert.ok(!repairTargets.has(target(s.pendingRef)), 'pending content is never planned')
  // Review and repair come first; materials and general filler follow.
  const lastPrescribed = Math.max(roles.lastIndexOf('repair'), roles.lastIndexOf('delayed_review'))
  const firstGeneral = roles.findIndex((r) => r === 'material_question' || r === 'general_practice')
  assert.ok(lastPrescribed < firstGeneral)
})

test('full route: hints never advance, restart resumes, two stages a day, generic next day, delayed recheck', async () => {
  const s = await setup()
  await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  s.clock.sgt('2027-03-02')
  let start = await s.engine.startOrResume('chinese')
  if (start.kind !== 'task') throw new Error('no task')
  const taskId = start.task.id
  // First repair question for 座: wrong first answer, correct after the hint.
  let step = await s.engine.next(taskId)
  while (step.kind === 'question' && step.presentation.target_ref !== target(ZUO)) {
    if (step.awaiting === 'first') await s.engine.answer(step.presentation.id, correctResponse(step.item))
    else if (step.awaiting === 'retry') await s.engine.retry(step.presentation.id, correctResponse(step.item))
    else await s.engine.correct(step.presentation.id, correctResponse(step.item))
    step = await s.engine.next(taskId)
  }
  assert.equal(step.kind, 'question')
  if (step.kind !== 'question') return
  assert.equal(step.presentation.stage, 'exact')
  await s.engine.answer(step.presentation.id, wrongResponse(step.item))
  await assert.rejects(() => s.engine.answer(step.presentation.id, correctResponse(step.item)), /first response already recorded/)
  await s.engine.retry(step.presentation.id, correctResponse(step.item))
  assert.equal(s.engine.derived().progress.get(target(ZUO))!.stage, 'exact', 'hint-assisted success does not advance')

  // Pause, restart the app, resume: same task, no new first attempt.
  await s.engine.pause(taskId)
  const firstEvents = s.engine.state.events.filter((e) => e.phase === 'first').length
  const re = await reopen(s)
  start = await re.engine.startOrResume('chinese')
  assert.equal(start.kind, 'task')
  if (start.kind !== 'task') return
  assert.equal(start.task.id, taskId)
  assert.equal(re.engine.state.events.filter((e) => e.phase === 'first').length, firstEvents)
  await run(re.engine, taskId, () => true)
  // 座 failed on day 2, so it waits for the day after the task; 住 and the private target cleared two stages.
  const zhu = re.engine.derived().progress.get(target(ZHU))!
  assert.equal(zhu.stage, 'generic')
  assert.equal(zhu.clearances.length, 2)
  assert.equal(re.engine.derived().progress.get(target(ZUO))!.stage, 'exact')

  // Same day: optional extra task cannot reach generic (later-day gate) or 座 (cooldown).
  const extra = await re.engine.startOrResume('chinese', { optional: true })
  if (extra.kind === 'task') {
    assert.ok(!extra.task.plan.slots.some((x) => x.target_ref === target(ZHU) || x.target_ref === target(ZUO)))
    await run(re.engine, extra.task.id, () => true)
  }

  s.clock.sgt('2027-03-03')
  const t3 = await re.engine.startOrResume('chinese')
  if (t3.kind !== 'task') throw new Error('no task')
  await run(re.engine, t3.task.id, () => true)
  const zhu3 = re.engine.derived().progress.get(target(ZHU))!
  assert.equal(zhu3.stage, 'delayed_review')
  assert.equal(zhu3.dueOn, '2027-03-04')

  // Delayed recheck on day 4: wrong → stays in delayed review, due the day after the task; then right → one day.
  s.clock.sgt('2027-03-04')
  const t4 = await re.engine.startOrResume('chinese')
  if (t4.kind !== 'task') throw new Error('no task')
  const roles4 = t4.task.plan.slots.filter((x) => x.kind === 'short').map((x) => x.role)
  assert.equal(roles4[0], 'delayed_review', 'due review first')
  await run(re.engine, t4.task.id, (q) => q.presentation.stage !== 'delayed_review' || q.presentation.target_ref !== target(ZHU))
  const zhu4 = re.engine.derived().progress.get(target(ZHU))!
  assert.equal(zhu4.stage, 'delayed_review')
  assert.equal(zhu4.dueOn, '2027-03-05')
  s.clock.sgt('2027-03-05')
  const t5 = await re.engine.startOrResume('chinese')
  if (t5.kind !== 'task') throw new Error('no task')
  await run(re.engine, t5.task.id, () => true)
  assert.equal(re.engine.derived().progress.get(target(ZHU))!.dueOn, '2027-03-06')

  // Report reflects actual attempts, from the engine replay.
  const report = re.program.report()!
  const row = report.cases.find((c) => c.case_id === 'O903')!
  assert.equal(row.status, 'in_delayed_review')
  assert.deepEqual(row.recognition!.delayed_checks.map((d) => d.correct), [false, true])
  assert.equal(row.recognition!.next_delayed_check, '2027-03-06')
  const zuoRows = report.cases.filter((c) => c.case_id === 'O901' || c.case_id === 'O902')
  assert.ok(zuoRows.every((c) => c.recognition!.hint_retries >= 1 && c.recognition!.stage === zuoRows[0].recognition!.stage))
  // Export: anonymous, includes each event with its cases and whether it counted as evidence.
  const file = re.program.exportFile()!
  const text = JSON.stringify(file)
  assert.doesNotMatch(text, /"(name|school|class|teacher|email|user_id|device)"\s*:/)
  const assisted = file.engine_events.filter((e) => e.assisted)
  assert.ok(assisted.length > 0 && assisted.every((e) => e.phase !== 'first'))
  assert.ok(file.engine_events.some((e) => e.case_ids.includes('O901') && e.case_ids.includes('O902')))
})

test('production evidence is separate from recognition; support never clears a stage', async () => {
  const s = await setup()
  await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  const plan = 'production-zh.p2_higher_chinese.char.u5ea7'
  await s.program.recordProduction(plan, 'supported', 'correct')
  assert.equal(s.program.productionProgress(plan).stage, 'exact')
  await s.program.recordProduction(plan, 'independent', 'correct')
  await s.program.recordProduction(plan, 'independent', 'correct')
  const p = s.program.productionProgress(plan)
  assert.equal(p.stage, 'generic') // two clearances today; generic waits for a later day
  await s.program.recordProduction(plan, 'independent', 'correct')
  assert.equal(s.program.productionProgress(plan).stage, 'generic', 'same-day generic is not credited')
  // Recognition untouched by production; production untouched by recognition.
  assert.equal(s.engine.derived().progress.get(target(ZUO))!.clearances.length, 0)
  const report = s.program.report()!
  const o901 = report.cases.find((c) => c.case_id === 'O901')!
  assert.equal(o901.production!.stage, 'generic')
  assert.equal(o901.recognition!.stage, 'exact')
  const o906 = report.cases.find((c) => c.case_id === 'O906')!
  assert.equal(o906.status, 'external_only')
  assert.equal(o906.production!.events, 0)
})

test('a flagged question removes its evidence and the stage is replayed without it', async () => {
  const s = await setup()
  await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  s.clock.sgt('2027-03-02')
  const t = await s.engine.startOrResume('chinese')
  if (t.kind !== 'task') throw new Error('no task')
  const seen: Q[] = []
  await run(s.engine, t.task.id, () => true, seen)
  const zhuExact = seen.find((q) => q.presentation.target_ref === target(ZHU) && q.presentation.stage === 'exact')!
  assert.equal(s.engine.derived().progress.get(target(ZHU))!.stage, 'generic')
  await s.engine.flag(zhuExact.presentation.id, 'answer_looks_wrong')
  const after = s.engine.derived().progress.get(target(ZHU))!
  assert.equal(after.stage, 'exact', 'the success on the flagged item no longer counts')
  const row = s.program.report()!.cases.find((c) => c.case_id === 'O903')!
  assert.equal(row.recognition!.excluded_presentations, 1)
  const exported = s.program.exportFile()!.engine_events.find((e) => e.presentation_id === zhuExact.presentation.id)!
  assert.equal(exported.counted_as_evidence, false)
})

test('a pack with identity fields, dates or unknown keys is rejected before anything is stored', async () => {
  const s = await setup()
  const bad = syntheticPack({ pendingRef: s.pendingRef }) as Record<string, unknown>
  const withName = structuredClone(bad) as { register: { cases: Record<string, unknown>[] } }
  withName.register.cases[0].name = 'x'
  await assert.rejects(() => s.program.installPack(withName), /pack_unknown_key/)
  const withDate = structuredClone(bad) as { register: { cases: Record<string, unknown>[] } }
  withDate.register.cases[0].observed = '2026-05-04'
  await assert.rejects(() => s.program.installPack(withDate), /case_text/)
  assert.equal(s.engine.state.targets.length, 0)
  assert.equal((await s.privateStore.packs()).length, 0)
})

test('a content revision keeps earlier evidence on its pinned version and new tasks use the revised item', async () => {
  const s = await setup()
  await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  s.clock.sgt('2027-03-02')
  const t = await s.engine.startOrResume('chinese')
  if (t.kind !== 'task') throw new Error('no task')
  // Answer part of the task, then pause: the task stays pinned to the original content version.
  for (let i = 0; i < 2; i++) {
    const step = await s.engine.next(t.task.id)
    if (step.kind === 'question' && step.awaiting === 'first') await s.engine.answer(step.presentation.id, correctResponse(step.item))
  }
  await s.engine.pause(t.task.id)
  const pinned = t.task.content_version
  const answered = s.engine.state.presentations.filter((p) => p.task_id === t.task.id && p.status === 'answered')
  assert.ok(answered.length > 0)
  // Publish a revision: one answered item gets version 2 (a new batch version too).
  const revised = structuredClone(s.publicContent)
  const changedId = answered[0].item_id
  const batch = revised.batches.find((b) => b.items.some((i) => i.id === changedId))
  if (batch) {
    batch.version += 1
    const it = batch.items.find((i) => i.id === changedId)!
    it.version += 1
    it.hint = `${it.hint}（修订）`
  }
  const registry2 = new CatalogueRegistry()
  const engine2 = await LearningEngine.load(s.store, 'Asia/Singapore', { registry: registry2, now: s.clock.now, newId: s.newId, writer: new WriteQueue(s.store, s.timers) })
  const program2 = await MistakeProgram.open({ engine: engine2, registry: registry2, publicContent: revised, store: s.privateStore, now: s.clock.now, newId: s.newId })
  assert.notEqual(program2.currentRelease()!.version, pinned, 'a new content version is current')
  // The unfinished task still resumes on its pinned version, with its earlier answers intact.
  const resumed = await engine2.startOrResume('chinese')
  assert.equal(resumed.kind, 'task')
  if (resumed.kind !== 'task') return
  assert.equal(resumed.task.content_version, pinned)
  await run(engine2, resumed.task.id, () => true)
  const kept = engine2.state.presentations.find((p) => p.id === answered[0].id)!
  assert.equal(kept.item_version, answered[0].item_version, 'evidence keeps the version that was answered')
  // A new task uses the revised content.
  s.clock.sgt('2027-03-03')
  const next = await engine2.startOrResume('chinese')
  if (next.kind !== 'task') throw new Error('no task')
  assert.equal(next.task.content_version, program2.currentRelease()!.version)
})

test('an updated pack stays current after a restart, whatever its ID sorts as, and pinned tasks still resume', async () => {
  const s = await setup()
  const first = syntheticPack({ pendingRef: s.pendingRef })
  first.pack_id = 'test-pack-zzz'
  await s.program.installPack(first)
  s.clock.sgt('2027-03-02')
  const t = await s.engine.startOrResume('chinese')
  if (t.kind !== 'task') throw new Error('no task')
  const step = await s.engine.next(t.task.id)
  if (step.kind === 'question') await s.engine.answer(step.presentation.id, correctResponse(step.item))
  await s.engine.pause(t.task.id)
  // A later pack whose ID sorts before the first one (pack IDs end in a content hash).
  const second = syntheticPack({ pendingRef: s.pendingRef, extraCase: true })
  second.pack_id = 'test-pack-aaa'
  await s.program.installPack(second)
  assert.equal((await s.privateStore.packs()).length, 1, 'only the current pack is kept')
  const re = await reopen(s)
  assert.ok(re.program.register!.cases.some((c) => c.id === 'O907'), 'the later register is current after restart')
  assert.ok(re.program.currentRelease()!.version.endsWith(':testpackaaa'))
  const resumed = await re.engine.startOrResume('chinese')
  if (resumed.kind !== 'task') throw new Error('no task')
  assert.equal(resumed.task.id, t.task.id)
  assert.equal(resumed.task.content_version, t.task.content_version, 'the paused task keeps its pinned content')
  await run(re.engine, resumed.task.id, () => true)
})

test('a case whose only attempt was replaced is reported as not yet evidenced', async () => {
  const s = await setup()
  await s.program.installPack(syntheticPack({ pendingRef: s.pendingRef }))
  s.clock.sgt('2027-03-02')
  const t = await s.engine.startOrResume('chinese')
  if (t.kind !== 'task') throw new Error('no task')
  const step = await s.engine.next(t.task.id)
  if (step.kind !== 'question' || !step.presentation.target_ref) throw new Error('expected a repair question first')
  await s.engine.answer(step.presentation.id, correctResponse(step.item))
  await s.engine.flag(step.presentation.id, 'answer_looks_wrong')
  await s.engine.pause(t.task.id)
  const caseId = s.program.crosswalk.find((r) => r.engine_target_id === step.presentation.target_ref)!.case_id
  const row = s.program.report()!.cases.find((c) => c.case_id === caseId)!
  assert.equal(row.recognition!.first_responses.correct, 1, 'the attempt is still shown')
  assert.equal(row.recognition!.counted_first_responses, 0)
  assert.equal(row.status, 'not_yet_evidenced')
})
