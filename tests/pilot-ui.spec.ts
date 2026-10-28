import { expect, test } from '@playwright/test'
import { answer, finish, parent, setup, state } from './helpers/pilot'

test('whole-material first answers precede feedback; assistance/corrections and safe checkpoints survive reload', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await parent(page)
  await page.getByLabel('Chinese X').selectOption('6')
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  // The passage is shown once, without its questions listed again: each question appears only in the current
  // question card, with its options.
  await expect(page.locator('.material')).toBeVisible()
  await expect(page.locator('.material ol, .material li')).toHaveCount(0)
  const stem = (await page.getByRole('article', { name: 'Current question' }).locator('h2').textContent())!
  await expect(page.getByText(stem, { exact: true })).toHaveCount(1)
  // The child is still told why no right/wrong appears until the whole material's first answers are in.
  await expect(page.locator('.material').getByText('Feedback follows all first answers in this material.')).toBeVisible()
  await answer(page, true)
  await expect(page.locator('.hint, .material-feedback')).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Resume Chinese' }).click()
  await answer(page)
  await answer(page)
  await expect(page.getByText('Hint', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Story checkpoint' }),
  ).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Resume Chinese' }).click()
  await expect(page.getByText('Hint', { exact: true })).toBeVisible()
  await answer(page, true)
  await expect(
    page.getByText('Supported correction', { exact: true }),
  ).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Resume Chinese' }).click()
  await expect(
    page.getByText('Supported correction', { exact: true }),
  ).toBeVisible()
  await answer(page)
  await expect(
    page.getByRole('region', { name: 'Story checkpoint' }),
  ).toBeVisible()
  expect(
    (await state(page)).events.filter((e) => e.phase === 'first').length,
  ).toBe(3)
  await page.reload()
  await page.getByRole('button', { name: 'Resume Chinese' }).click()
  await expect(
    page.getByRole('region', { name: 'Story checkpoint' }),
  ).toHaveCount(0)
  await finish(page)
  const stored = await state(page)
  const story = stored.records.find((r) => r.table === 'story').value
  expect(story.checkpoints.length).toBe(2)
  expect(story.checkpoints.every((c) => c.state === 'delivered')).toBe(true)
  await page.getByRole('button', { name: 'Return to the island' }).click()
  await parent(page)
  await page.locator('.summary details summary').first().click()
  await expect(page.getByText(/First answer:/).first()).toBeVisible()
  await expect(page.getByText(/Hint-assisted retry:/)).toBeVisible()
  await expect(page.getByText(/Supported correction:/)).toBeVisible()
})

test('all objective formats work with click controls and no answer keyboard; academic language stays fixed', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await parent(page)
  await page.getByLabel('Chinese X').selectOption('6')
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  const original = await page.locator('.question-card h2').innerText()
  await page.getByRole('button', { name: '中文', exact: true }).click()
  await expect(page.locator('.question-card h2')).toHaveText(original)
  await page.getByRole('button', { name: 'English', exact: true }).click()
  await finish(page)
  const stored = await state(page)
  expect(new Set(stored.events.map((e) => e.response.kind))).toEqual(
    new Set(['single', 'word_bank', 'ordered', 'matching']),
  )
  expect(stored.events.every((e) => e.correct)).toBe(true)
  await page.getByRole('button', { name: 'Return to the island' }).click()
  await page.getByRole('button', { name: 'Start Mathematics' }).click()
  const en = await page.locator('.question-card h2').innerText()
  await page.getByRole('button', { name: '中文', exact: true }).click()
  await expect(page.locator('.question-card h2')).toHaveText(en)
  await expect(page.locator('.practice input, .practice textarea')).toHaveCount(
    0,
  )
})

for (const order of [
  ['Chinese', 'Science', 'Mathematics', 'English'],
  ['English', 'Mathematics', 'Chinese', 'Science'],
]) {
  test(`one finite adventure and exploration gate: ${order.join(' → ')}`, async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000)
    await setup(page, context)
    await parent(page)
    for (const subject of order)
      await page.getByLabel(`${subject} X`).selectOption('6')
    await page.getByRole('button', { name: 'Exit and lock' }).click()
    await expect(
      page.getByRole('button', { name: 'Explore the island' }),
    ).toBeDisabled()
    await page.getByRole('button', { name: 'Walk to the pond' }).click()
    await expect(page.locator('.speech')).toContainText('Finish today’s trails')
    const content: string[] = []
    for (const [index, subject] of order.entries()) {
      await page.getByRole('button', { name: `Start ${subject}` }).click()
      content.push(...(await finish(page)))
      await expect(
        page.getByText(/overall score|accuracy|percent correct/i),
      ).toHaveCount(0)
      await page.getByRole('button', { name: 'Return to the island' }).click()
      if (index < 3)
        await expect(
          page.getByRole('button', { name: 'Explore the island' }),
        ).toBeDisabled()
    }
    await expect(
      page.getByRole('button', { name: 'Explore the island' }),
    ).toBeEnabled()
    await page.getByRole('button', { name: 'Walk to the pond' }).click()
    await expect(page.locator('.speech')).toContainText('A quiet pond')
    expect(
      content.filter((s) => s.includes('Moss finds a tiny lantern')).length,
    ).toBe(1)
    expect(content.some((s) => s.includes('A visit from Moss'))).toBe(true)
    const story = (await state(page)).records.find(
      (r) => r.table === 'story',
    ).value
    expect(story.ended).toBe(true)
    expect(story.world_flags).toContain('lantern_lit')
    await page.reload()
    await expect(page.getByLabel('Lit lantern')).toBeVisible()
    await page.getByRole('button', { name: 'Talk to Moss' }).click()
    await expect(page.getByText(/Our lantern is glowing/)).toBeVisible()
  })
}

test('combined checkpoint occurs once at the final material boundary', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await parent(page)
  await page.getByLabel('English X').selectOption('6')
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.getByRole('button', { name: 'Start English' }).click()
  const seen = await finish(page)
  expect(seen.length).toBe(1)
  await page.reload()
  const story = (await state(page)).records.find(
    (r) => r.table === 'story',
  ).value
  expect(story.checkpoints.length).toBe(1)
  expect(story.checkpoints[0].kind).toBe('combined')
})

test('rest preserves an unfinished task and gives no completion/story credit; tomorrow resumes', async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date('2027-03-01T10:00:00+08:00') })
  await setup(page, context)
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await answer(page)
  await parent(page)
  await page.getByRole('button', { name: 'Today is a rest day' }).click()
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await expect(
    page.getByRole('button', { name: 'Explore the island' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: 'Resume Chinese' }),
  ).toBeDisabled()
  const before = await state(page)
  expect(before.records.filter((r) => r.table === 'completions')).toHaveLength(
    0,
  )
  expect(
    before.records.find((r) => r.table === 'story').value.checkpoints,
  ).toHaveLength(0)
  await page.clock.setSystemTime(new Date('2027-03-02T10:00:00+08:00'))
  await page.reload()
  await page.getByRole('button', { name: 'Resume Chinese' }).click()
  await finish(page)
  const after = await state(page)
  expect(after.records.filter((r) => r.table === 'tasks')).toHaveLength(1)
  expect(
    after.records.find((r) => r.table === 'completions').value.local_date,
  ).toBe('2027-03-02')
})

test('local save failure warns, allows continuation and retries without duplicating answers', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await page.evaluate(() => {
    // Dexie caches the transaction method at open. Inject at the actual write entry point.
    const original = IDBObjectStore.prototype.put
    ;(globalThis as any).restoreSyntheticTransactions = () => {
      IDBObjectStore.prototype.put = original
    }
    IDBObjectStore.prototype.put = function (...args: any[]) {
      if (this.transaction.db.name.startsWith('turtle-academy-synthetic-'))
        throw new DOMException('Synthetic failure', 'QuotaExceededError')
      return original.apply(this, args as any)
    }
  })
  await answer(page)
  await expect(page.getByRole('alert')).toContainText(
    'Some changes are not saved',
  )
  await expect(page.getByRole('alert')).toContainText(
    'Reloading, closing or termination may lose',
  )
  await answer(page)
  await page.evaluate(() => (globalThis as any).restoreSyntheticTransactions())
  await page.getByRole('button', { name: 'Retry local save' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.reload()
  const stored = await state(page)
  expect(stored.events.length).toBe(2)
  expect(new Set(stored.events.map((e) => e.id)).size).toBe(2)
})

test('measured time stops in the background and across idle gaps; settings freeze for an active task', async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date('2027-03-01T10:00:00+08:00') })
  await setup(page, context)
  await page.getByRole('button', { name: 'Start Mathematics' }).click()
  await page.clock.fastForward(30_000)
  await answer(page)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.fastForward(60_000)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.fastForward(10_000)
  await answer(page)
  await page.clock.fastForward(130_000)
  await answer(page)
  await parent(page)
  await expect(page.getByTestId('time-mathematics')).toHaveText('40')
  await page.getByLabel('Mathematics X').selectOption('6')
  await page.getByLabel('Timezone', { exact: true }).fill('Pacific/Kiritimati')
  await page.getByRole('button', { name: 'Save timezone' }).click()
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.getByRole('button', { name: 'Resume Mathematics' }).click()
  await expect(
    page.getByText('3 / 10 questions answered', { exact: true }),
  ).toBeVisible()
  const stored = await state(page)
  expect(
    stored.records
      .find((r) => r.table === 'settings')
      .value.subjects.find((s) => s.subject === 'mathematics').x,
  ).toBe(6)
})

test('a second tab cannot write the same working copy', async ({
  page,
  context,
}) => {
  await setup(page, context)
  const second = await context.newPage()
  await second.goto('/')
  await expect(second.getByRole('alert')).toContainText('open in another tab')
  await page.close()
  await second.reload()
  await expect(
    second.getByRole('button', { name: 'Start Chinese' }),
  ).toBeVisible()
})

test('a checkpoint delayed by save failure waits for the next complete material boundary after recovery', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await parent(page)
  await page.getByLabel('Chinese X').selectOption('6')
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await answer(page)
  await answer(page)
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    ;(globalThis as any).restoreWrites = () => {
      IDBObjectStore.prototype.put = original
    }
    IDBObjectStore.prototype.put = function (...args: any[]) {
      if (this.transaction.db.name.startsWith('turtle-academy-synthetic-'))
        throw new DOMException('Synthetic failure', 'QuotaExceededError')
      return original.apply(this, args as any)
    }
  })
  await answer(page) // completes material one; halfway checkpoint cannot yet be saved
  await expect(page.getByRole('alert')).toContainText(
    'Some changes are not saved',
  )
  await answer(page) // begins material two while the warning is visible
  await page.evaluate(() => (globalThis as any).restoreWrites())
  await page.getByRole('button', { name: 'Retry local save' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await answer(page) // saving recovered, but this is still inside material two
  await expect(
    page.getByRole('region', { name: 'Story checkpoint' }),
  ).toHaveCount(0)
  await answer(page) // now the complete material is a safe boundary
  await expect(
    page.getByRole('region', { name: 'Story checkpoint' }),
  ).toBeVisible()
  await finish(page)
  const stored = await state(page)
  expect(stored.events.length).toBe(6)
  const checkpoints = stored.records.find((r) => r.table === 'story').value
    .checkpoints
  expect(checkpoints).toHaveLength(2)
  expect(new Set(checkpoints.map((c) => c.id)).size).toBe(2)
})

test('a checkpoint whose own delivery write fails is still presented once, not silently skipped', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await parent(page)
  await page.getByLabel('Chinese X').selectOption('6')
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await answer(page)
  await answer(page)
  await page.evaluate(() => {
    // Fail only the write that marks a checkpoint delivered; the answer that emits it saves normally.
    const original = IDBObjectStore.prototype.put
    ;(globalThis as any).restoreWrites = () => {
      IDBObjectStore.prototype.put = original
    }
    IDBObjectStore.prototype.put = function (...args: any[]) {
      const row = args[0]
      if (
        this.transaction.db.name.startsWith('turtle-academy-synthetic-') &&
        row?.table === 'story' &&
        row.value?.checkpoints?.some((c: any) => c.state === 'delivered')
      )
        throw new DOMException('Synthetic failure', 'QuotaExceededError')
      return original.apply(this, args as any)
    }
  })
  await answer(page) // completes material one; the halfway delivery cannot be saved yet
  await expect(page.getByRole('alert')).toContainText(
    'Some changes are not saved',
  )
  const story = page.getByRole('region', { name: 'Story checkpoint' })
  await expect(story).toBeVisible()
  await page.evaluate(() => (globalThis as any).restoreWrites())
  await page.getByRole('button', { name: 'Retry local save' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await story.getByRole('button', { name: 'Continue', exact: true }).click()
  const later = await finish(page)
  expect(later).toHaveLength(1)
  const checkpoints = (await state(page)).records.find(
    (r) => r.table === 'story',
  ).value.checkpoints
  expect(checkpoints).toHaveLength(2)
  expect(checkpoints.every((c: any) => c.state === 'delivered')).toBe(true)
})
