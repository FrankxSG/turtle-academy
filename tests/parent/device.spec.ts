import { expect, test, type Page } from '@playwright/test'
import { build } from 'vite'
import { mockAuth, parent, setup } from '../helpers/pilot'

let bundle = ''
test.beforeAll(async () => {
  const output = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: {
        entry: 'tests/browser/parent-harness.ts',
        name: 'ParentHarnessBundle',
        formats: ['iife'],
      },
    },
  })
  const result = Array.isArray(output) ? output[0] : output
  const chunk =
    'output' in result
      ? result.output.find((x) => x.type === 'chunk')
      : undefined
  if (!chunk || chunk.type !== 'chunk')
    throw new Error('parent harness build failed')
  bundle = chunk.code
})
async function open(page: Page) {
  await page.route('**/parent-harness.html', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Parent module harness</title>',
    }),
  )
  await page.goto('/parent-harness.html')
  await page.addScriptTag({ content: bundle })
}

test('PIN lengths, salted slow hash, no plaintext, and structural exclusion from snapshots', async ({
  page,
}) => {
  await open(page)
  const result = await page.evaluate(async () => {
    const h = (globalThis as any).ParentHarness
    let rejected = 0
    for (const pin of ['123', '1234567', '12ab', '１２３４']) {
      try {
        await h.initializeDevice('invalid', pin)
      } catch {
        rejected++
      }
    }
    await h.initializeDevice('one', '4826')
    await h.initializeDevice('two', '4826')
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('turtle-academy-device-v1')
      r.onsuccess = () => resolve(r.result)
    })
    const tx = db.transaction('devices', 'readonly')
    const req = tx.objectStore('devices').getAll()
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
    })
    db.close()
    const rows = req.result
    const engine = h.LearningEngine.fresh('Asia/Singapore', {
      registry: h.developmentRegistry(),
      now: () => new Date().toISOString(),
    })
    const snapshot = JSON.stringify(
      h.buildSnapshot(
        engine.state,
        engine.derived(),
        'synthetic-child',
        new Date().toISOString(),
      ),
    )
    return {
      rejected,
      policy: h.PIN_POLICY,
      salted:
        rows[0].salt !== rows[1].salt && rows[0].digest !== rows[1].digest,
      bounded: rows.every(
        (r: any) => r.salt.length === 32 && r.digest.length === 64,
      ),
      plaintextAbsent: rows.every(
        (r: Record<string, unknown>) =>
          Object.keys(r).sort().join(',') ===
            'blockedUntil,digest,failures,id,salt,version' &&
          !Object.values(r).includes('4826'),
      ),
      excluded: rows.every(
        (r: any) => !snapshot.includes(r.digest) && !snapshot.includes(r.salt),
      ),
      four: (await h.verifyPin('one', '4826')).ok,
    }
  })
  expect(result).toEqual({
    rejected: 4,
    policy: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 600000,
      saltBytes: 16,
      bits: 256,
    },
    salted: true,
    bounded: true,
    plaintextAbsent: true,
    excluded: true,
    four: true,
  })
})

test('back-off grows, persists after reload, serializes attempts and fails closed on a security-state save failure', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2027-01-01T00:00:00Z') })
  await open(page)
  await page.evaluate(async () => {
    await (globalThis as any).ParentHarness.initializeDevice('test', '4826')
  })
  const verify = (pin: string) =>
    page.evaluate(
      async (p) => (globalThis as any).ParentHarness.verifyPin('test', p),
      pin,
    )
  expect(await verify('1111')).toEqual({ ok: false, waitSeconds: 1 })
  await open(page)
  expect((await verify('4826')).ok).toBe(false)
  await page.clock.fastForward(1100)
  const simultaneous = await page.evaluate(async () =>
    Promise.all([
      (globalThis as any).ParentHarness.verifyPin('test', '1111'),
      (globalThis as any).ParentHarness.verifyPin('test', '1111'),
    ]),
  )
  expect(simultaneous.every((r) => !r.ok && r.waitSeconds === 2)).toBe(true)
  await page.clock.fastForward(2200)
  expect(await verify('1111')).toEqual({ ok: false, waitSeconds: 4 })
  await page.clock.fastForward(4200)
  const closed = await page.evaluate(async () => {
    const original = IDBDatabase.prototype.transaction
    IDBDatabase.prototype.transaction = function (...args: any[]) {
      if (this.name === 'turtle-academy-device-v1' && args[1] === 'readwrite')
        throw new DOMException('Synthetic denial', 'QuotaExceededError')
      return original.apply(this, args as any)
    }
    try {
      await (globalThis as any).ParentHarness.verifyPin('test', '4826')
      return false
    } catch {
      return true
    } finally {
      IDBDatabase.prototype.transaction = original
    }
  })
  expect(closed).toBe(true)
  expect((await verify('4826')).ok).toBe(true)
  await page.evaluate(async () => {
    await (globalThis as any).ParentHarness.initializeDevice('six', '123456')
  })
  expect(
    await page.evaluate(
      async () =>
        (await (globalThis as any).ParentHarness.verifyPin('six', '123456')).ok,
    ),
  ).toBe(true)
})

test('PIN gate locks on exit, reload and background; settings are inaccessible while locked', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await page.getByRole('button', { name: 'Parent area', exact: true }).click()
  await page.getByLabel('Parent PIN', { exact: true }).fill('123')
  await expect(
    page.getByRole('button', { name: 'Unlock parent area' }),
  ).toBeDisabled()
  await expect(page.getByLabel('Chinese X')).toHaveCount(0)
  await page.getByLabel('Parent PIN', { exact: true }).fill('4826')
  await page.getByRole('button', { name: 'Unlock parent area' }).click()
  await expect(page.getByLabel('Chinese X')).toBeVisible()
  await page.evaluate(() =>
    document.dispatchEvent(new Event('visibilitychange')),
  )
  await expect(page.getByLabel('Chinese X')).toHaveCount(0)
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await parent(page)
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await page.getByRole('button', { name: 'Parent area', exact: true }).click()
  await expect(page.getByLabel('Parent PIN', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Parent area', exact: true }).click()
  await expect(page.getByLabel('Chinese X')).toHaveCount(0)
})

test('reset requires successful same-account online password authentication; offline/failed/wrong-account leave the existing PIN intact', async ({
  page,
  context,
}) => {
  await setup(page, context)
  await page.getByRole('button', { name: 'Parent area', exact: true }).click()
  await page.getByRole('button', { name: 'Forgot PIN?' }).click()
  const fill = async (password: string) => {
    await page
      .getByLabel('Account email', { exact: true })
      .fill('parent@example.invalid')
    await page.getByLabel('Account password', { exact: true }).fill(password)
    await page.getByLabel('New PIN', { exact: true }).fill('987654')
    await page
      .getByRole('button', { name: 'Verify password and reset' })
      .click()
  }
  await context.setOffline(true)
  await fill('synthetic-password')
  await expect(page.getByRole('alert')).toContainText('PIN unchanged')
  await context.setOffline(false)
  await fill('wrong-password')
  await expect(page.getByRole('alert')).toContainText('PIN unchanged')
  await mockAuth(context, 'synthetic-parent-b')
  await fill('synthetic-password')
  await expect(page.getByRole('alert')).toContainText('PIN unchanged')
  await page.getByRole('button', { name: 'Back to PIN unlock' }).click()
  await page.getByLabel('Parent PIN', { exact: true }).fill('4826')
  await page.getByRole('button', { name: 'Unlock parent area' }).click()
  await expect(page.getByLabel('Chinese X')).toBeVisible()
  await page.getByRole('button', { name: 'Exit and lock' }).click()
  await mockAuth(context)
  await page.getByRole('button', { name: 'Parent area', exact: true }).click()
  await page.getByRole('button', { name: 'Forgot PIN?' }).click()
  await fill('synthetic-password')
  await expect(
    page.getByText('PIN changed. Unlock with your new PIN.'),
  ).toBeVisible()
  await page.getByLabel('Parent PIN', { exact: true }).fill('987654')
  await page.getByRole('button', { name: 'Unlock parent area' }).click()
  await expect(page.getByLabel('Chinese X')).toBeVisible()
})
