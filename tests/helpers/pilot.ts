import { expect, type Page, type BrowserContext } from '@playwright/test'

export async function mockAuth(context: BrowserContext, user = 'synthetic-parent-a') {
  await context.route('**/auth/v1/**', async (route) => {
    if (route.request().url().includes('/logout')) { await route.fulfill({ status: 204 }); return }
    const body = route.request().postDataJSON()
    if (body.password === 'synthetic-password') await route.fulfill({ json: { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: user } } })
    else await route.fulfill({ status: 400, json: { error: 'invalid_grant' } })
  })
}
export async function setup(page: Page, context: BrowserContext) {
  await mockAuth(context)
  await page.goto('/')
  await page.getByLabel('Parent email', { exact: true }).fill('parent@example.invalid')
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Set up this device' })).toBeVisible()
  await page.getByLabel('Choose PIN', { exact: true }).fill('4826')
  await page.getByLabel('Confirm PIN', { exact: true }).fill('4826')
  await page.getByRole('button', { name: 'Open the island' }).click()
  await expect(page.getByRole('heading', { name: 'A little discovery. A new adventure.' })).toBeVisible()
}
export async function parent(page: Page, pin = '4826') {
  await page.getByRole('button', { name: 'Parent area', exact: true }).click()
  await page.getByLabel('Parent PIN', { exact: true }).fill(pin)
  await page.getByRole('button', { name: 'Unlock parent area' }).click()
  await expect(page.getByRole('heading', { name: 'Daily practice size' })).toBeVisible()
}
export async function state(page: Page) {
  return page.evaluate(async () => {
    const names = await indexedDB.databases()
    const name = names.find((d) => d.name?.startsWith('turtle-academy-synthetic-'))!.name!
    const db = await new Promise<IDBDatabase>((resolve) => { const req = indexedDB.open(name); req.onsuccess = () => resolve(req.result) })
    const tx = db.transaction(['records', 'events'], 'readonly')
    const r = tx.objectStore('records').getAll(); const e = tx.objectStore('events').getAll()
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve() })
    db.close()
    return { records: r.result, events: e.result }
  })
}
export async function answer(page: Page, wrong = false) {
  const card = page.getByRole('article', { name: 'Current question' })
  const signature = await card.getAttribute('data-step')
  const selects = card.getByRole('combobox')
  if (await selects.count()) {
    await selects.nth(0).selectOption(wrong ? 'r2' : 'r1')
    await selects.nth(1).selectOption(wrong ? 'r1' : 'r2')
  } else if (await card.getByRole('button', { name: 'Clear order' }).count()) {
    for (const name of wrong ? ['▲', '■', '●'] : ['●', '■', '▲']) await card.getByRole('button', { name, exact: true }).click()
  } else {
    const options = card.locator('.options button')
    await options.nth(wrong ? 1 : (await options.first().innerText()) === '■' ? 1 : 0).click()
  }
  await card.getByRole('button', { name: 'Submit answer' }).click()
  await expect.poll(async () => {
    if (await page.getByRole('region', { name: 'Story checkpoint' }).count()) return true
    if (await page.getByRole('heading', { name: 'This trail is complete!' }).count()) return true
    return await page.getByRole('article', { name: 'Current question' }).getAttribute('data-step') !== signature
  }).toBe(true)
}
export async function finish(page: Page) {
  const checkpoints: string[] = []
  for (let n = 0; n < 100; n++) {
    const story = page.getByRole('region', { name: 'Story checkpoint' })
    if (await story.count()) { checkpoints.push(await story.innerText()); await story.getByRole('button', { name: 'Continue', exact: true }).click(); continue }
    if (await page.getByRole('heading', { name: 'This trail is complete!' }).count()) return checkpoints
    const teaching = page.getByRole('button', { name: 'Ready to try' })
    if (await teaching.count()) { await teaching.click(); continue }
    await answer(page)
  }
  throw new Error('Synthetic task did not finish')
}
