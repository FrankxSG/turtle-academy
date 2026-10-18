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
