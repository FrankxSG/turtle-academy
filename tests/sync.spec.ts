// Live sync in the browser (first milestone, one device): real IndexedDB outbox and the real PostgreSQL server
// functions, reached through supabase/tests/sync_server.py (a local stand-in for the Supabase endpoints, started
// by playwright.config.ts). Synthetic parents and records only; never a hosted project.
import { expect, test, type BrowserContext, type Page, type APIRequestContext } from '@playwright/test'
import { answer, parent, state } from './helpers/pilot'

const SERVER = process.env.SYNC_SERVER_URL ?? 'http://127.0.0.1:54331'

/** Send the app's Supabase calls to the local sync server; drop them while the test has the device offline. */
async function useSyncServer(context: BrowserContext) {
  const net = { offline: false }
  await context.route(/\/(auth|rest)\/v1\//, async (route) => {
    if (net.offline) return route.abort('internetdisconnected')
    const u = new URL(route.request().url())
    try {
      const response = await route.fetch({ url: `${SERVER}${u.pathname}${u.search}` })
      await route.fulfill({ response })
    } catch {
      await route.abort('connectionreset')
    }
  })
  return {
    async offline(on: boolean) {
      net.offline = on
      await context.setOffline(on)
    },
  }
}

async function sql(request: APIRequestContext, q: string): Promise<string[][]> {
  return (await request.post(`${SERVER}/__test/sql`, { data: { sql: q } })).json()
}
const answers = (request: APIRequestContext, email: string) =>
  sql(request, `select count(*) from public.sync_records r join public.family_members m on true join public.children c on c.id = r.child_id and c.family_id = m.family_id join auth.users u on u.id = m.user_id where u.email = '${email}' and r.kind = 'answer_event';`)
    .then((rows) => Number(rows[0][0]))
const setting = (request: APIRequestContext, email: string, key: string) =>
  sql(request, `select r.value::text from public.sync_records r join public.children c on c.id = r.child_id join public.family_members m on m.family_id = c.family_id join auth.users u on u.id = m.user_id where u.email = '${email}' and r.kind = 'setting' and r.key = '${key}';`)
    .then((rows) => (rows[0] ? JSON.parse(rows[0][0]) : null))

async function signIn(page: Page, email: string) {
  await page.goto('/')
  await page.getByLabel('Parent email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Set up this device' })).toBeVisible()
  await page.getByLabel('Choose PIN', { exact: true }).fill('4826')
  await page.getByLabel('Confirm PIN', { exact: true }).fill('4826')
  await page.getByRole('button', { name: 'Open the island' }).click()
  await expect(page.getByRole('heading', { name: 'A little discovery. A new adventure.' })).toBeVisible()
}

async function syncNow(page: Page) {
  await page.getByRole('button', { name: 'Sync now' }).click()
}

test('online practice uploads; the parent sees saved-on-device and synced as separate facts', async ({ page, context, request }) => {
  await useSyncServer(context)
  await signIn(page, 'browser-1@example.invalid')
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await answer(page)
  await parent(page)
  await syncNow(page)
  await expect(page.getByTestId('sync-state')).toHaveText('Up to date', { timeout: 20_000 })
  await expect.poll(() => answers(request, 'browser-1@example.invalid'), { timeout: 20_000 }).toBe(1)
  await expect(page.getByTestId('sync-state')).toHaveText('Up to date', { timeout: 20_000 })
  await expect(page.getByTestId('waiting')).toHaveText('0')
  await expect(page.getByTestId('local-save')).toContainText('Yes')
  await expect(page.getByTestId('last-sync')).not.toHaveText('Not yet')
  for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByTestId('sync-panel').screenshot({ path: `test-results/ui-review/sync-up-to-date-${viewport.width}.png` })
  }
})

test('offline answers and settings survive a restart, then upload when the connection returns', async ({ page, context, request }) => {
  const net = await useSyncServer(context)
  await signIn(page, 'browser-2@example.invalid')
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await net.offline(true)
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await answer(page)
  await answer(page)
  await parent(page)
  await page.getByLabel('Chinese X').selectOption('7')
  await expect(page.getByTestId('sync-state')).toContainText('Offline')
  const waiting = Number(await page.getByTestId('waiting').innerText())
  expect(waiting).toBeGreaterThan(0)
  await expect(page.getByText('Clearing this browser’s data or removing the app now would lose')).toBeVisible()
  await page.getByTestId('sync-panel').screenshot({ path: 'test-results/ui-review/sync-offline-1024.png' })
  // Restart while offline: the queue is in IndexedDB, not memory.
  await page.reload()
  await expect(page.getByRole('button', { name: 'Resume Chinese' })).toBeVisible()
  await parent(page)
  // Still queued after the restart (reopening adds its own activity records, so the count can only grow).
  expect(Number(await page.getByTestId('waiting').innerText())).toBeGreaterThanOrEqual(waiting)
  expect(await answers(request, 'browser-2@example.invalid')).toBe(0)
  await net.offline(false)
  await expect.poll(() => answers(request, 'browser-2@example.invalid'), { timeout: 20_000 }).toBe(2)
  await expect(page.getByTestId('sync-state')).toHaveText('Up to date', { timeout: 20_000 })
  await expect(page.getByTestId('waiting')).toHaveText('0')
  expect((await setting(request, 'browser-2@example.invalid', 'x:chinese'))?.x).toBe(7)
})

test('an expired session keeps practice working; sync asks for the same account and then resumes', async ({ page, context, request }) => {
  await useSyncServer(context)
  await signIn(page, 'browser-1@example.invalid')
  await request.post(`${SERVER}/__test/expire`, { data: { email: 'browser-1@example.invalid', revoke_refresh: true } })
  await page.evaluate(() => {
    const key = 'ta.auth.session.v1'
    const s = JSON.parse(localStorage.getItem(key)!)
    s.expiresAt = 0
    localStorage.setItem(key, JSON.stringify(s))
  })
  await page.reload()
  await page.getByRole('button', { name: /(Start|Resume) Chinese/ }).click()
  await answer(page)
  await parent(page)
  await syncNow(page)
  await expect(page.getByTestId('sync-state')).toContainText('Sign-in required')
  await expect(page.getByTestId('local-save')).toContainText('Yes')
  await page.getByTestId('sync-panel').screenshot({ path: 'test-results/ui-review/sync-sign-in-1024.png' })
  const panel = page.getByTestId('sync-panel')
  // A different account is refused and never receives this device's queued changes.
  await panel.getByLabel('Parent email').fill('browser-3@example.invalid')
  await panel.getByLabel('Password').fill('synthetic-password')
  await panel.getByRole('button', { name: 'Sign in to sync' }).click()
  await expect(page.getByRole('alert')).toContainText('belong to a different parent account')
  expect(await answers(request, 'browser-3@example.invalid')).toBe(0)
  await panel.getByLabel('Parent email').fill('browser-1@example.invalid')
  await panel.getByLabel('Password').fill('synthetic-password')
  await panel.getByRole('button', { name: 'Sign in to sync' }).click()
  await expect(page.getByTestId('sync-state')).toHaveText('Up to date', { timeout: 20_000 })
  await expect(page.getByTestId('waiting')).toHaveText('0')
})

test('a reset device restores the synced records after sign-in and resumes the unfinished task', async ({ page, context, browser, request }) => {
  await useSyncServer(context)
  await signIn(page, 'browser-3@example.invalid')
  await page.getByRole('button', { name: 'Start Chinese' }).click()
  await answer(page)
  await answer(page)
  await parent(page)
  await syncNow(page)
  await expect.poll(() => answers(request, 'browser-3@example.invalid'), { timeout: 20_000 }).toBe(2)
  await expect(page.getByTestId('sync-state')).toHaveText('Up to date', { timeout: 20_000 })
  const before = await state(page)
  // A second, empty browser profile stands in for a wiped iPad.
  const fresh = await browser.newContext({ baseURL: test.info().project.use.baseURL, serviceWorkers: 'allow' })
  await useSyncServer(fresh)
  const wiped = await fresh.newPage()
  await signIn(wiped, 'browser-3@example.invalid')
  await expect(wiped.getByRole('button', { name: 'Resume Chinese' })).toBeVisible({ timeout: 20_000 })
  const after = await state(wiped)
  expect(after.events.map((e: { id: string }) => e.id).sort()).toEqual(before.events.map((e: { id: string }) => e.id).sort())
  await parent(wiped)
  await expect(wiped.getByTestId('sync-state')).toHaveText('Up to date', { timeout: 20_000 })
  await wiped.getByRole('button', { name: 'Exit and lock' }).click()
  await wiped.getByRole('button', { name: 'Resume Chinese' }).click()
  await answer(wiped)
  expect((await state(wiped)).events.length).toBe(3)
  await fresh.close()
})
