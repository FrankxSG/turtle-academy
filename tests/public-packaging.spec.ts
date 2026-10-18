// Tests the DEFAULT public build, after signing in and unlocking the parent area.
import { expect, test } from '@playwright/test'
import { setup, parent } from './helpers/pilot'

test('public build cannot open private storage or expose pack import/export', async ({ page, context }) => {
  await setup(page, context)
  // Runtime state, a URL parameter and browser storage cannot enable a build-time-only feature.
  await page.evaluate(() => localStorage.setItem('VITE_ENABLE_PRIVATE_PACK', 'true'))
  await page.goto('/?VITE_ENABLE_PRIVATE_PACK=true')
  await expect(page.getByRole('button', { name: 'Parent area', exact: true })).toBeVisible()
  await parent(page)
  await expect(page.getByTestId('mistake-pack')).toHaveCount(0)
  await expect(page.getByTestId('mistake-export')).toHaveCount(0)
  await expect(page.locator('input[type=file]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Save progress file/ })).toHaveCount(0)
  expect(await page.evaluate(async () => (await indexedDB.databases()).some((db) => db.name?.startsWith('turtle-academy-private-')))).toBe(false)
  await page.screenshot({ path: 'test-results/ui-review/public-parent.png', fullPage: true })
})
