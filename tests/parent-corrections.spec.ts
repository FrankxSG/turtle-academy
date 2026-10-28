// Parent flag review, Chinese mistake progress and answer invalidation on the deployed configuration (reviewed public
// Chinese content). Synthetic parent and child only; no learner record is used or produced.
import { readFileSync, readdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { parent, setup, state } from './helpers/pilot'

const root = new URL('../content/chinese/', import.meta.url)
const batches = readdirSync(new URL('batches/', root))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(`batches/${f}`, root), 'utf8')))
const keyIndex = new Map<string, number>()
for (const b of batches) for (const i of b.items) keyIndex.set(i.id, i.options.findIndex((o: any) => o.id === i.correct_option_id))

const card = (page: Page) => page.getByRole('article', { name: 'Current question' })

async function shownItem(page: Page): Promise<string> {
  const id = (await card(page).getAttribute('data-step'))!.split(':')[0]
  return (await state(page)).records.find((r: any) => r.table === 'presentations' && r.value.id === id).value.item_id
}

async function advanced(page: Page, signature: string | null) {
  await expect
    .poll(async () => {
      if (await page.getByRole('region', { name: 'Story checkpoint' }).count()) return true
      if (await page.getByRole('heading', { name: 'This trail is complete!' }).count()) return true
      const now = await page.locator('[data-step]').evaluateAll((els) => els[0]?.getAttribute('data-step') ?? null)
      return now !== null && now !== signature
    })
    .toBe(true)
}

/** Answer the current question (first answer, retry or correction): correct, or one wrong option. */
async function answer(page: Page, correct: boolean) {
  const signature = await card(page).getAttribute('data-step')
  const key = keyIndex.get(await shownItem(page))!
  const options = card(page).locator('.options button')
  await options.nth(correct ? key : (key + 1) % (await options.count())).click()
  await card(page).getByRole('button', { name: 'Submit answer' }).click()
  await advanced(page, signature)
}

/** Finish the task: the first first-answer listed in `wrongFirst` is wrong, everything else correct. */
async function finish(page: Page, wrongFirst: number) {
  let firsts = 0
  for (let n = 0; n < 150; n++) {
    const story = page.getByRole('region', { name: 'Story checkpoint' })
    if (await story.count()) { await story.getByRole('button', { name: 'Continue', exact: true }).click(); continue }
    if (await page.getByRole('heading', { name: 'This trail is complete!' }).count()) return
    const step = (await card(page).getAttribute('data-step'))!
    if (step.endsWith(':first')) { firsts++; await answer(page, firsts !== wrongFirst) } else await answer(page, true)
  }
  throw new Error('task did not finish')
}

test('flag review, mistake progress and answer exclusion work through the parent area, offline and after reload', async ({ page, context }) => {
  test.setTimeout(120_000)
  await page.clock.install({ time: new Date('2027-03-01T10:00:00+08:00') })
  await setup(page, context)
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  // The child reports a problem with the first question; it is replaced.
  const flagged = await shownItem(page)
  const before = await card(page).getAttribute('data-step')
  await card(page).getByRole('button', { name: 'Report a problem and replace this question' }).click()
  await advanced(page, before)
  // One first answer is wrong (banked as an app-caught mistake); the task is finished.
  await finish(page, 2)
  await page.getByRole('button', { name: 'Return to the island' }).click()

  await parent(page)
  // Flag review shows the question with its key, and the decision is for this child only.
  const flag = page.getByTestId(`flag-${flagged}`)
  await expect(flag).toContainText('Waiting for your decision')
  await expect(flag).toContainText('flagged before answering')
  // Mistake progress: one row for the app-caught mistake, repair stage 1, practised from tomorrow.
  const rows = page.locator('article[data-testid^="progress-"]')
  await expect(rows).toHaveCount(1)
  const row = rows.first()
  await expect(row.getByTestId('progress-state')).toHaveText('Repair 1/3 · original error')
  await expect(row.getByTestId('progress-next')).toHaveText('From 2027-03-02')
  await expect(row).toContainText('caught in app practice on 1 day(s)')
  await page.setViewportSize({ width: 1180, height: 820 })
  await page.getByRole('heading', { name: 'Chinese mistakes and progress' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/ui-review/parent-progress-landscape.png', fullPage: true })

  // Offline: keep the flagged question disabled and exclude the mistaken answer. Both are saved on the device.
  await context.setOffline(true)
  await flag.getByRole('button', { name: 'Keep disabled for this child' }).click()
  await expect(flag).toContainText('Disabled for this child')
  await expect(flag.getByRole('button')).toHaveCount(0)
  await page.getByText('Chinese · 2027-03-01 · Finished').click()
  expect(await page.getByRole('button', { name: 'This answer was recorded by mistake — exclude it' }).count()).toBeGreaterThan(0)
  // The wrong answer's row is the one whose first answer "needs correction".
  const wrongLi = page.locator('details li').filter({ hasText: 'First answer' }).filter({ hasText: 'needs correction' }).first()
  await wrongLi.getByRole('button', { name: 'This answer was recorded by mistake — exclude it' }).click()
  await wrongLi.getByRole('button', { name: 'Confirm: exclude this answer' }).click()
  await expect(wrongLi).toContainText('(excluded from evidence)')
  // The mistake it created no longer counts; the finished day stays finished.
  await expect(page.locator('article[data-testid^="progress-"]')).toHaveCount(0)
  await expect(page.getByText('Completion reason: Full task completed')).toBeVisible()
  await page.screenshot({ path: 'test-results/ui-review/parent-flags-landscape.png', fullPage: true })
  const saved = (await state(page)).records.filter((r: any) => r.table === 'amendments').map((r: any) => r.value.kind).sort()
  expect(saved).toEqual(['disable_item', 'invalidate_presentation'])

  // Exit locks the controls; a reload (still offline) keeps every decision.
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await expect(page.getByRole('button', { name: 'Keep disabled for this child' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Chinese mistakes and progress' })).toHaveCount(0)
  await page.reload()
  await parent(page)
  await expect(page.getByTestId(`flag-${flagged}`)).toContainText('Disabled for this child')
  await expect(page.locator('article[data-testid^="progress-"]')).toHaveCount(0)
  await page.getByText('Chinese · 2027-03-01 · Finished').click()
  await expect(page.getByText('(excluded from evidence)')).toHaveCount(1)
  await context.setOffline(false)
})
