import { expect, test } from '@playwright/test'

test('guest answer persists through reload and offline navigation', async ({ page, context }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  await expect(page.getByText('Ready for an offline adventure', { exact: true })).toBeVisible()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await page.getByRole('button', { name: 'Explore Science' }).click()
  await page.getByRole('button', { name: 'A stone', exact: true }).click()
  await expect(page.getByText('Saved on this device · 1 discovery attempts')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Look again' })).toBeVisible()
  await page.getByRole('button', { name: 'A turtle', exact: true }).click()
  await expect(page.getByText('Saved on this device · 2 discovery attempts')).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Let curiosity lead the way.' })).toBeVisible()
  await expect(page.getByText('Saved on this device · 2 discovery attempts')).toBeVisible()
  await expect(page.getByText('Ready for an offline adventure', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Explore Science' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Yes! A turtle is living.' })).toBeVisible()
  await page.getByRole('button', { name: 'A chair', exact: true }).click()
  await expect(page.getByText('Saved on this device · 3 discovery attempts')).toBeVisible()
  await context.setOffline(false)
  await page.reload()
  await expect(page.getByText('Saved on this device · 3 discovery attempts')).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('storage failure is visible and never claims that an answer was saved', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { configurable: true, get() { throw new Error('Storage disabled for test') } })
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('could not open your saved progress')
  await page.getByRole('button', { name: 'Explore Science' }).click()
  await expect(page.getByRole('button', { name: 'A turtle', exact: true })).toBeDisabled()
  await expect(page.getByText(/Saved on this device/)).toHaveCount(0)
})

for (const viewport of [{ width: 1024, height: 768 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
  test('no horizontal overflow at ' + viewport.width + 'x' + viewport.height, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.getByRole('button', { name: 'Explore Science' }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('button', { name: 'A turtle', exact: true })).toBeVisible()
  })
}

test('browser denial of database access is reported', async ({ page }) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = function () {
      throw new DOMException('Database denied for test', 'SecurityError')
    }
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('could not open your saved progress')
  await expect(page.getByText(/Saved on this device/)).toHaveCount(0)
})
