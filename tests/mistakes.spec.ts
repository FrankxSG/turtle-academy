// Browser test of the deployed configuration: reviewed Chinese content plus a SYNTHETIC private mistake pack.
// The cases are invented (tests/engine/fixtures/private-pack.ts); no learner record is used or produced.
import { readFileSync, readdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { parent, setup, state } from './helpers/pilot'
import { syntheticPack } from './engine/fixtures/private-pack'

const root = new URL('../content/chinese/', import.meta.url)
const json = (p: string) => JSON.parse(readFileSync(new URL(p, root), 'utf8'))
const batches = readdirSync(new URL('batches/', root))
  .filter((f) => f.endsWith('.json'))
  .map((f) => json(`batches/${f}`))

// A P2 Higher Chinese character with no public questions yet, so its case is held as "waiting for questions".
const used = new Set(
  batches.flatMap((b) =>
    b.items.flatMap((i: any) => [...i.target_refs, ...(i.repair_target_refs ?? [])]),
  ),
)
const pendingRef: string = json('curriculum.json').characters.find(
  (c: any) => c.course === 'p2_higher_chinese' && !used.has(c.id),
).id
const pack = syntheticPack({ pendingRef })
// Options render in content order, so the key's index identifies the button.
const keyIndex = new Map<string, number>()
for (const b of [...batches, ...pack.corrective_batches])
  for (const i of b.items)
    keyIndex.set(
      i.id,
      i.options.findIndex((o: any) => o.id === i.correct_option_id),
    )

const ZUO = 'zh.p2_higher_chinese.char.u5ea7'
const caseOf: Record<string, string> = {
  [`case-target:${ZUO}`]: 'O901',
  'case-target:zh.p2_higher_chinese.char.u4f4f': 'O903',
  'case-target:zh.p2_higher_chinese.skill.synthetic-sound': 'O904',
}

async function current(page: Page) {
  const card = page.getByRole('article', { name: 'Current question' })
  const id = (await card.getAttribute('data-step'))!.split(':')[0]
  const stored = await state(page)
  return stored.records.find(
    (r: any) => r.table === 'presentations' && r.value.id === id,
  ).value
}

async function answerCorrectly(page: Page) {
  const card = page.getByRole('article', { name: 'Current question' })
  const signature = await card.getAttribute('data-step')
  const p = await current(page)
  await card.locator('.options button').nth(keyIndex.get(p.item_id)!).click()
  await card.getByRole('button', { name: 'Submit answer' }).click()
  await expect
    .poll(async () =>
      page
        .locator('[data-step]')
        .evaluateAll((els) => els[0]?.getAttribute('data-step') ?? null),
    )
    .not.toBe(signature)
  return p
}

test('accepted mistakes import, are practised first the next day, and report and export real progress', async ({
  page,
  context,
}) => {
  test.setTimeout(90_000)
  await page.clock.install({ time: new Date('2027-03-01T10:00:00+08:00') })
  await setup(page, context)
  await parent(page)
  const upload = page.getByTestId('mistake-pack')
  const file = (p: unknown) => ({
    name: 'pack.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(p)),
  })
  await upload.setInputFiles(file(pack))
  await expect(page.getByTestId('mistake-message')).toContainText('New practice targets: 4')
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 6')
  await expect(page.getByTestId('case-O905')).toContainText('Waiting for questions')
  await expect(page.getByTestId('case-O901')).toContainText('Not yet evidenced')
  await expect(page.getByTestId('case-O906')).toContainText('Parent-observed only')
  // Re-importing the same pack changes nothing.
  await upload.setInputFiles(file(pack))
  await expect(page.getByTestId('mistake-message')).toContainText(
    'New practice targets: 0; new cases linked to existing targets: 0',
  )
  // A malformed pack is refused without touching the programme.
  await upload.setInputFiles(file({ schema_version: 'nope' }))
  await expect(page.getByTestId('mistake-message')).toContainText('This file was not accepted')
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 6')
  await page.getByRole('button', { name: 'Exit and lock' }).click()

  // Next learning day: repair for the imported cases comes before general practice.
  await page.clock.setSystemTime(new Date('2027-03-02T10:00:00+08:00'))
  await page.reload()
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await expect(page.getByText('ORIGINAL PRACTICE · REVIEW IN PROGRESS')).toBeVisible()
  await expect(page.locator('.shape-picture')).toHaveCount(0)
  const task = (await state(page)).records.find((r: any) => r.table === 'tasks').value
  const roles: string[] = task.plan.slots.map((s: any) => s.role)
  expect(roles[0]).toBe('repair')
  expect(roles.lastIndexOf('repair')).toBeLessThan(
    roles.findIndex((r) => r === 'material_question' || r === 'general_practice'),
  )
  const planned = new Set(task.plan.slots.map((s: any) => s.target_ref))
  expect(planned.has(`case-target:${pendingRef}`)).toBe(false)
  // Synthetic pack only; never a credential or PIN screen.
  await page.screenshot({ path: 'test-results/ui-review/chinese-repair.png', fullPage: true })
  const answered = await answerCorrectly(page)
  expect(answered.target_ref).toMatch(/^case-target:/)
  expect(answered.stage).toBe('exact')

  // Pause, reload, and the saved first answer appears against the original case.
  await page.getByRole('button', { name: 'Pause and return' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Resume Chinese' })).toBeVisible()
  await parent(page)
  const row = page.getByTestId(`case-${caseOf[answered.target_ref]}`)
  await expect(row).toContainText('In repair')
  await expect(row).toContainText('1/0')
  // Cases with no attempt stay honestly unevidenced.
  await expect(page.getByTestId('case-O905')).toContainText('Waiting for questions')

  await page.getByTestId('mistake-table').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/ui-review/mistake-report.png', fullPage: true })
  // Parent-observed writing: help never advances; an independent correct does.
  const writing = page.getByTestId(`plan-production-${ZUO}`)
  await writing.getByRole('button', { name: 'With help' }).click()
  await expect(writing).toContainText('with help 1')
  await expect(writing).toContainText('same question')
  await writing.getByRole('button', { name: 'Correct on own' }).click()
  await expect(writing).toContainText('Independent correct 1')
  await expect(writing).toContainText('similar')

  // The private export reflects the actual attempts and holds no account details.
  const download = page.waitForEvent('download')
  await page.getByTestId('mistake-export').click()
  const text = readFileSync(await (await download).path(), 'utf8')
  expect(text).not.toContain('synthetic-parent-a')
  expect(text).not.toContain('parent@example.invalid')
  const out = JSON.parse(text)
  expect(out.schema_version).toBe('turtle-private-export/1')
  expect(out.report.cases).toHaveLength(6)
  const firsts = out.engine_events.filter((e: any) => e.phase === 'first')
  expect(firsts).toHaveLength(1)
  expect(firsts[0].case_ids).toContain(caseOf[answered.target_ref])
  expect(firsts[0].correct).toBe(true)
  expect(out.production_events.map((e: any) => e.mode)).toEqual([
    'supported',
    'independent',
  ])
  const zuo = out.report.cases.find((c: any) => c.case_id === 'O901')
  expect(zuo.production.stage).toBe('similar')
  expect(
    out.report.cases.find((c: any) => c.case_id === 'O905').status,
  ).toBe('pending_content')
})

test('an unusable stored route is quarantined without exposing its report or losing the source', async ({ page, context }) => {
  await setup(page, context)
  await parent(page)
  const file = { name: 'synthetic-pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) }
  await page.getByTestId('mistake-pack').setInputFiles(file)
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 6')
  await page.evaluate(async () => {
    const name = (await indexedDB.databases()).find((d) => d.name?.startsWith('turtle-academy-private-'))!.name!
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open(name); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error)
    })
    const tx = db.transaction('packs', 'readwrite')
    const store = tx.objectStore('packs')
    const request = store.getAll()
    request.onsuccess = () => {
      const stored = request.result[0]
      stored.register.cases[0].route.progress_target_ref = 'zh.p2_higher_chinese.skill.no-longer-declared'
      store.put(stored)
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error) })
    db.close()
  })
  await page.reload()
  await parent(page)
  await expect(page.getByText(/intake_unknown_target/)).toBeVisible()
  await expect(page.getByTestId('mistake-table')).toHaveCount(0)
  await expect(page.getByTestId('mistake-export')).toHaveCount(0)
  await expect(page.locator('[data-testid^="plan-"]')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/ui-review/private-pack-recovery.png', fullPage: true })
  await page.getByTestId('mistake-pack').setInputFiles(file)
  await expect(page.getByText(/intake_unknown_target/)).toHaveCount(0)
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 6')
})

test('a failed save while installing a pack says so, keeps the earlier pack and recovers on retry', async ({ page, context }) => {
  await setup(page, context)
  await parent(page)
  const file = (p: unknown) => ({ name: 'synthetic-pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(p)) })
  await page.getByTestId('mistake-pack').setInputFiles(file(pack))
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 6')
  // Fail only writes of the private pack store, as a full disk or blocked storage would.
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    ;(globalThis as any).restorePackWrites = () => { IDBObjectStore.prototype.put = original }
    IDBObjectStore.prototype.put = function (...args: any[]) {
      if (this.transaction.db.name.startsWith('turtle-academy-private-') && this.name === 'packs')
        throw new DOMException('Synthetic failure', 'QuotaExceededError')
      return original.apply(this, args as any)
    }
  })
  const larger = syntheticPack({ pendingRef, extraCase: true })
  await page.getByTestId('mistake-pack').setInputFiles(file(larger))
  await expect(page.getByTestId('mistake-message')).toContainText('could not be saved on this device')
  await expect(page.getByTestId('mistake-message')).not.toContainText('not accepted')
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 6')
  await page.evaluate(() => (globalThis as any).restorePackWrites())
  await page.getByTestId('mistake-pack').setInputFiles(file(larger))
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 7')
})

test('a save that fails after the pack is stored says the new pack is in use and offers to finish saving', async ({ page, context }) => {
  await setup(page, context)
  await parent(page)
  const file = (p: unknown) => ({ name: 'synthetic-pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(p)) })
  // An unreadable file is labelled as the file's problem, not a device save failure.
  await page.getByTestId('mistake-pack').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{not json') })
  await expect(page.getByTestId('mistake-message')).toContainText('could not be read as a mistake pack')
  await page.getByTestId('mistake-pack').setInputFiles(file(pack))
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 6')
  // Fail only the case-link write, which happens after the pack itself is saved.
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    ;(globalThis as any).restoreLinkWrites = () => { IDBObjectStore.prototype.put = original }
    IDBObjectStore.prototype.put = function (...args: any[]) {
      if (this.transaction.db.name.startsWith('turtle-academy-private-') && this.name === 'kv')
        throw new DOMException('Synthetic failure', 'QuotaExceededError')
      return original.apply(this, args as any)
    }
  })
  await page.getByTestId('mistake-pack').setInputFiles(file(syntheticPack({ pendingRef, extraCase: true })))
  await expect(page.getByTestId('mistake-import-pending')).toContainText('saved and in use')
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 7')
  await expect(page.getByText('nothing new is in use')).toHaveCount(0)
  await page.evaluate(() => (globalThis as any).restoreLinkWrites())
  await page.getByTestId('mistake-import-pending').getByRole('button', { name: 'Finish saving' }).click()
  await expect(page.getByTestId('mistake-import-pending')).toHaveCount(0)
  await expect(page.getByTestId('mistake-message')).toContainText('All records are saved')
  await page.reload()
  await parent(page)
  await expect(page.getByTestId('mistake-totals')).toContainText('Cases 7')
})
