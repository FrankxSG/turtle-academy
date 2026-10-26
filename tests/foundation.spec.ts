import { expect, test } from '@playwright/test'
import { setup, state, answer, parent, finish } from './helpers/pilot'

test('initialized practice survives expired-session offline reload and offline writes', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await setup(page, context)
  await expect(
    page.getByText('Ready for an offline adventure', { exact: false }),
  ).toBeVisible()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await answer(page)
  await page.evaluate(() => {
    const key = 'ta.auth.session.v1'
    const session = JSON.parse(localStorage.getItem(key)!)
    session.expiresAt = 0
    localStorage.setItem(key, JSON.stringify(session))
  })
  let authRequests = 0
  page.on('request', (req) => {
    if (req.url().includes('/auth/v1/')) authRequests++
  })
  await context.setOffline(true)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Resume Chinese' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Resume Chinese' }).click()
  await answer(page)
  await parent(page)
  await page.getByLabel('Chinese X').selectOption('7')
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.reload()
  expect((await state(page)).events.length).toBe(2)
  // Offline practice with an expired session never needed the network or a token refresh.
  expect(authRequests).toBe(0)
  await context.setOffline(false)
  await page.reload()
  // Back online, sync may try to renew the session in the background; local records are unaffected.
  expect((await state(page)).events.length).toBe(2)
  expect(errors).toEqual([])
})

test('default (Chinese-only) build: finishing reviewed Chinese opens exploration', async ({ page, context }) => {
  test.setTimeout(120_000)
  await setup(page, context)
  await parent(page)
  await page.getByLabel('Chinese X').selectOption('6')
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await expect(page.getByRole('button', { name: 'Explore the island' })).toBeDisabled()
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await finish(page)
  await page.getByRole('button', { name: 'Return to the island' }).click()
  await expect(page.getByRole('button', { name: 'Explore the island' })).toBeEnabled()
  await page.getByRole('button', { name: 'Walk to the pond' }).click()
  await expect(page.locator('.speech')).toContainText('A quiet pond')
})

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 844, height: 390 },
  { width: 390, height: 844 },
]) {
  test(`no horizontal overflow in hub, practice and parent at ${viewport.width}x${viewport.height}`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize(viewport)
    await setup(page, context)
    for (const screen of ['hub', 'practice', 'parent']) {
      if (screen === 'practice')
        await page.getByRole('button', { name: 'Start Chinese' }).click()
      if (screen === 'parent') await parent(page)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
      // Synthetic screens after setup/unlock only; never capture a credential or PIN entry screen.
      if (viewport.width === 1024)
        await page.screenshot({
          path: `test-results/ui-review/${screen}.png`,
          fullPage: true,
        })
    }
  })
}

test('first use needs online sign-in and offers no Guest or signup', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await context.setOffline(true)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: /Guest|sign.?up/i }),
  ).toHaveCount(0)
  await expect(page.getByText(/First setup needs internet/)).toBeVisible()
})

for (const deny of ['property', 'open'])
  test(`browser storage denial (${deny}) never claims saved progress`, async ({
    page,
    context,
  }) => {
    await setup(page, context)
    await page.addInitScript((mode) => {
      if (mode === 'property')
        Object.defineProperty(window, 'indexedDB', {
          configurable: true,
          get() {
            throw new Error('Synthetic denial')
          },
        })
      else
        IDBFactory.prototype.open = function () {
          throw new DOMException('Synthetic denial', 'SecurityError')
        }
    }, deny)
    await page.reload()
    await expect(page.getByRole('alert')).toContainText(
      'could not open your saved progress',
    )
    await expect(
      page.getByRole('button', { name: 'Start Chinese' }),
    ).toHaveCount(0)
  })
