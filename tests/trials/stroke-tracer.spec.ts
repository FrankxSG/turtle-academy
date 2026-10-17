import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

// Browser checks for the trials build (Issue #8). Synthetic input only:
// desktop pointer events cannot certify real finger, stylus or palm behaviour.
type P = { x: number; y: number }
const median = (character: string, stroke: number): P[] => {
  const data = JSON.parse(readFileSync(new URL('../../src/trials/stroke-tracer/data/' + character + '.json', import.meta.url), 'utf8'))
  return (data.medians[stroke] as number[][]).map(([x, y]) => ({ x, y: 900 - y }))
}

async function toScreen(page: Page, p: P) {
  const box = (await page.getByTestId('stroke-board').boundingBox())!
  return { x: box.x + (p.x / 1024) * box.width, y: box.y + (p.y / 1024) * box.height }
}

async function mouseStroke(page: Page, points: P[]) {
  await page.getByTestId('stroke-board').scrollIntoViewIfNeeded()
  const first = await toScreen(page, points[0])
  await page.mouse.move(first.x, first.y)
  await page.mouse.down()
  for (const p of points.slice(1)) {
    const s = await toScreen(page, p)
    await page.mouse.move(s.x, s.y, { steps: 4 })
  }
  await page.mouse.up()
}

/** Dispatches a synthetic pointer sequence of the given type and contact size. */
async function pointerStroke(page: Page, id: number, pointerType: 'touch' | 'pen', points: P[], contact = 10, finish = true) {
  const screen = await Promise.all(points.map((p) => toScreen(page, p)))
  await page.evaluate(({ id, pointerType, screen, contact, finish }) => {
    const board = document.querySelector('[data-testid=stroke-board]')!
    const fire = (type: string, p: { x: number; y: number }) => board.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType, clientX: p.x, clientY: p.y,
      width: contact, height: contact, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
    }))
    fire('pointerdown', screen[0])
    for (const p of screen.slice(1)) fire('pointermove', p)
    if (finish) fire('pointerup', screen[screen.length - 1])
  }, { id, pointerType, screen, contact, finish })
}

const inkCount = (page: Page) => page.locator('.st-ink polyline').count()

async function openTrial(page: Page, input: 'Finger' | 'Stylus' | 'Mouse' = 'Mouse') {
  await page.goto('/#/stroke-tracer')
  await expect(page.getByRole('note')).toContainText('nothing you draw is saved')
  await page.getByRole('button', { name: new RegExp('^' + input) }).click()
  await expect(page.getByTestId('input-choice')).toHaveText(input)
}

const diagonal: P[] = [{ x: 200, y: 200 }, { x: 400, y: 400 }, { x: 600, y: 600 }]

test('hub lists the trial; unknown and direct routes behave', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Turtle Academy trials' })).toBeVisible()
  await expect(page.getByText('exploring', { exact: true })).toBeVisible()
  await expect(page.getByText(/Later phase/)).toBeVisible()
  await page.goto('/#/no-such-trial')
  await expect(page.getByRole('heading', { name: 'Trial not found' })).toBeVisible()
  await page.goto('/#/stroke-tracer')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Chinese stroke tracer' })).toBeVisible()
})

test('watch steps through strokes and plays to the end', async ({ page }) => {
  await openTrial(page)
  const board = page.getByTestId('stroke-board')
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(board).toHaveAttribute('data-shown', '0')
  await expect(page.getByRole('button', { name: 'Restart' })).toBeDisabled()
  await page.getByRole('button', { name: 'Next stroke' }).click()
  await expect(board).toHaveAttribute('data-shown', '1')
  await page.getByRole('button', { name: 'Restart' }).click()
  await expect(board).toHaveAttribute('data-shown', '0')
  await page.getByRole('button', { name: 'Next stroke' }).click()
  await page.getByLabel('Speed').selectOption('1.6')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(board).toHaveAttribute('data-shown', '2', { timeout: 5000 })
  await expect(page.getByTestId('stroke-status')).toHaveText('All 2 strokes shown.')
})

test('free trace: ungraded ink, undo, outline toggle, cleared on change', async ({ page }) => {
  await openTrial(page)
  await page.getByRole('button', { name: 'Free trace' }).click()
  await mouseStroke(page, median('人', 0))
  await mouseStroke(page, median('人', 1).reverse())
  expect(await inkCount(page)).toBe(2)
  await expect(page.getByTestId('stroke-status')).toContainText('Nothing is checked or saved')
  await page.getByRole('button', { name: 'Undo' }).click()
  expect(await inkCount(page)).toBe(1)
  await page.getByRole('button', { name: 'Hide outline' }).click()
  await expect(page.locator('.st-outline')).toHaveCount(0)
  await page.getByRole('button', { name: '大 dà' }).click()
  expect(await inkCount(page)).toBe(0)
})

// Pause CSS playback and deliver animation-end explicitly so these regressions
// exercise the inter-stroke timer without timing-sensitive sleeps.
async function controlledWatch(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  await page.goto('/#/stroke-tracer')
  // Pause CSS playback before Watch mounts; otherwise a slow runner can finish
  // the first real animation before the pause applies, and no .st-anim remains.
  await page.addStyleTag({ content: '.st-anim { animation-play-state: paused !important; }' })
  await page.getByRole('button', { name: /^Mouse/ }).click()
  await expect(page.getByTestId('input-choice')).toHaveText('Mouse')
}

/** Ends the current Watch animation and waits until React has handled it (the stroke unmounts for the gap). */
async function endAnimation(page: Page) {
  await page.locator('.st-board path.st-anim').dispatchEvent('animationend')
  await expect(page.locator('.st-board path.st-anim')).toHaveCount(0)
}

/** Advances fake time in small steps so timers scheduled by React effects mid-way still fire. */
async function advance(page: Page, ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 50) await page.clock.runFor(50)
}

async function advanceUntilShown(page: Page, value: string) {
  await expect.poll(async () => {
    await page.clock.runFor(50)
    return page.getByTestId('stroke-board').getAttribute('data-shown')
  }, { timeout: 5000 }).toBe(value)
}

test('watch Pause cancels a pending inter-stroke advance', async ({ page }) => {
  await controlledWatch(page)
  await endAnimation(page)
  await page.getByRole('button', { name: 'Pause' }).click()
  await advance(page, 1000)
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-shown', '0')
  await expect(page.getByTestId('stroke-status')).toContainText('paused')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await endAnimation(page)
  await advanceUntilShown(page, '1')
})

test('watch character changes cancel the old gap and start a fresh animation', async ({ page }) => {
  await controlledWatch(page)
  await endAnimation(page)
  await page.getByRole('button', { name: '大 dà' }).click()
  await advance(page, 1000)
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-shown', '0')
  await page.locator('.st-board path.st-anim').evaluate((el) => el.setAttribute('data-old-animation', 'true'))
  await page.getByRole('button', { name: '字 zì' }).click()
  await expect(page.locator('[data-old-animation]')).toHaveCount(0)
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-shown', '0')
  await endAnimation(page)
  await advanceUntilShown(page, '1')
})

test('watch mode, input changes and Restart discard pending playback', async ({ page }) => {
  await controlledWatch(page)
  await endAnimation(page)
  await page.getByRole('button', { name: 'Free trace' }).click()
  await page.getByRole('button', { name: 'Watch', exact: true }).click()
  await advance(page, 1000)
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-shown', '0')
  await endAnimation(page)
  await page.getByRole('button', { name: 'Use finger' }).click()
  await advance(page, 1000)
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-shown', '0')
  await endAnimation(page)
  await advanceUntilShown(page, '1')
  await endAnimation(page)
  await page.getByRole('button', { name: 'Restart', exact: true }).click()
  await advance(page, 1000)
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-shown', '0')
})

test('guided Start again clears parent completion and attempt evidence', async ({ page }) => {
  await openTrial(page)
  await page.getByRole('button', { name: 'Guided (experimental)' }).click()
  for (let i = 0; i < 2; i++) await mouseStroke(page, median('人', i))
  await expect(page.getByTestId('guided-complete')).toBeVisible()
  await page.getByText('Tester details').click()
  await expect(page.getByTestId('attempt-summary')).toHaveText('Checked strokes: 2 · not accepted: 0')
  await page.getByRole('button', { name: 'Start again', exact: true }).click()
  await expect(page.getByTestId('guided-complete')).toHaveCount(0)
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-done', '0')
  await expect(page.getByTestId('attempt-summary')).toHaveText('Checked strokes: 0 · not accepted: 0')
  await mouseStroke(page, median('人', 0))
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-done', '1')
  await expect(page.getByTestId('attempt-summary')).toHaveText('Checked strokes: 1 · not accepted: 0')
})

test('demo licence link serves the exact bundled data licence', async ({ page }) => {
  await openTrial(page)
  const link = page.getByRole('link', { name: 'Arphic Public License', exact: true })
  await expect(link).toHaveAttribute('href', './licences/ARPHICPL.TXT')
  const response = await page.request.get('/licences/ARPHICPL.TXT')
  expect(response.ok()).toBe(true)
  expect(await response.body()).toEqual(readFileSync(new URL('../../src/trials/stroke-tracer/data/ARPHICPL.TXT', import.meta.url)))
})

test('guided: rejects reversed, wrong-order, scribbled and shortcut strokes; completes in order', async ({ page }) => {
  await openTrial(page)
  await page.getByRole('button', { name: '大 dà' }).click()
  await page.getByRole('button', { name: 'Guided (experimental)' }).click()
  const board = page.getByTestId('stroke-board')
  await mouseStroke(page, median('大', 0).reverse())
  await mouseStroke(page, median('大', 1))
  const first = median('大', 0)
  await mouseStroke(page, [...first, ...[...first].reverse(), ...first])
  await expect(board).toHaveAttribute('data-done', '0')
  await expect(page.getByTestId('stroke-status')).toContainText('orange stroke')
  await mouseStroke(page, median('大', 0))
  const bent = median('大', 1)
  await mouseStroke(page, [bent[0], bent[bent.length - 1]])
  await expect(board).toHaveAttribute('data-done', '1')
  await mouseStroke(page, median('大', 1))
  await mouseStroke(page, median('大', 2))
  await expect(board).toHaveAttribute('data-done', '3')
  await expect(page.getByTestId('stroke-status')).toHaveText('Reference strokes completed.')
  await expect(page.getByTestId('guided-complete')).toBeVisible()
  await expect(page.getByText(/Well traced/)).toHaveCount(0)
  await page.getByText('Tester details').click()
  await expect(page.getByTestId('attempt-summary')).toHaveText('Checked strokes: 7 · not accepted: 4')
})

test('guided: all six strokes of 字 complete in order', async ({ page }) => {
  await openTrial(page)
  await page.getByRole('button', { name: '字 zì' }).click()
  await page.getByRole('button', { name: 'Guided (experimental)' }).click()
  for (let i = 0; i < 6; i++) await mouseStroke(page, median('字', i))
  await expect(page.getByTestId('stroke-board')).toHaveAttribute('data-done', '6')
})

test('finger mode: wide contact ignored, pen takes over an active touch', async ({ page }) => {
  await openTrial(page, 'Finger')
  await page.getByRole('button', { name: 'Free trace' }).click()
  await pointerStroke(page, 1, 'touch', diagonal, 80)
  expect(await inkCount(page)).toBe(0)
  await pointerStroke(page, 2, 'touch', diagonal, 12)
  expect(await inkCount(page)).toBe(1)
  await pointerStroke(page, 3, 'touch', diagonal, 12, false)
  await pointerStroke(page, 4, 'pen', diagonal.map((p) => ({ x: p.x + 100, y: p.y })), 1)
  expect(await inkCount(page)).toBe(2)
})

test('stylus mode ignores touch; returning to finger restores touch drawing', async ({ page }) => {
  await openTrial(page, 'Stylus')
  await page.getByRole('button', { name: 'Free trace' }).click()
  await pointerStroke(page, 1, 'touch', diagonal, 12)
  expect(await inkCount(page)).toBe(0)
  await pointerStroke(page, 2, 'pen', diagonal, 1)
  expect(await inkCount(page)).toBe(1)
  await page.getByRole('button', { name: 'Use finger' }).click()
  await expect(page.getByTestId('input-choice')).toHaveText('Finger')
  await pointerStroke(page, 3, 'touch', diagonal, 12)
  expect(await inkCount(page)).toBe(1)
})

test('pointer cancel discards the stroke; reset returns to the start screen', async ({ page }) => {
  await openTrial(page, 'Finger')
  await page.getByRole('button', { name: 'Free trace' }).click()
  const screen = await toScreen(page, diagonal[0])
  await page.evaluate(({ x, y }) => {
    const board = document.querySelector('[data-testid=stroke-board]')!
    const init = { bubbles: true, pointerId: 9, pointerType: 'touch', clientX: x, clientY: y, width: 10, height: 10 }
    board.dispatchEvent(new PointerEvent('pointerdown', init))
    board.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + 80, clientY: y + 80 }))
    board.dispatchEvent(new PointerEvent('pointercancel', init))
  }, screen)
  expect(await inkCount(page)).toBe(0)
  await page.getByText('Tester details').click()
  await page.getByRole('button', { name: 'Reset trial' }).click()
  await expect(page.getByText('What will you draw with?')).toBeVisible()
})

test('no storage, service worker or input-bearing requests', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (r) => { if (r.method() !== 'GET' || !r.url().startsWith('http://127.0.0.1:4174/')) requests.push(r.method() + ' ' + r.url()) })
  await openTrial(page)
  await page.getByRole('button', { name: 'Guided (experimental)' }).click()
  await mouseStroke(page, median('人', 0))
  await page.getByRole('button', { name: 'Free trace' }).click()
  await mouseStroke(page, median('人', 1))
  const state = await page.evaluate(async () => ({
    local: localStorage.length, session: sessionStorage.length,
    databases: (await indexedDB.databases()).length,
    workers: (await navigator.serviceWorker.getRegistrations()).length,
  }))
  expect(state).toEqual({ local: 0, session: 0, databases: 0, workers: 0 })
  expect(requests).toEqual([])
})

for (const viewport of [{ width: 1180, height: 820 }, { width: 1024, height: 768 }, { width: 820, height: 1180 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 667, height: 375 }]) {
  test('fits ' + viewport.width + 'x' + viewport.height + ' without horizontal overflow', async ({ page }) => {
    await page.setViewportSize(viewport)
    await openTrial(page)
    for (const mode of ['Watch', 'Free trace', 'Guided (experimental)']) {
      await page.getByRole('button', { name: mode }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), mode).toBe(true)
      // The board, its status line and its buttons are visible together.
      const tracer = (await page.locator('.st').boundingBox())!
      expect(tracer.height, mode).toBeLessThanOrEqual(viewport.height)
      if (viewport.width > viewport.height) {
        // Landscape: header, board and buttons fit without scrolling.
        expect(tracer.y + tracer.height, mode).toBeLessThanOrEqual(viewport.height)
      }
    }
  })
}

test.describe('page zoom while drawing', () => {
  test.use({ hasTouch: true })

  // Returns whether each synthetic zoom-type event had its default prevented.
  const zoomBlocked = (page: Page) => page.evaluate(() => {
    const touch = (id: number) => new Touch({ identifier: id, target: document.body, clientX: 100 + id * 40, clientY: 200 })
    const touchmove = (count: number) => {
      const touches = Array.from({ length: count }, (_, i) => touch(i))
      // Start where the move happens, so a one-finger move is not a downward pull.
      document.body.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches, targetTouches: touches, changedTouches: touches }))
      const event = new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches, targetTouches: touches, changedTouches: touches })
      document.body.dispatchEvent(event)
      return event.defaultPrevented
    }
    const gesture = new Event('gesturestart', { bubbles: true, cancelable: true })
    document.body.dispatchEvent(gesture)
    return {
      pinch: touchmove(2),
      oneFinger: touchmove(1),
      gesture: gesture.defaultPrevented,
      locked: document.documentElement.classList.contains('t-zoom-locked'),
    }
  })

  test('trial page blocks pinch and Safari gesture zoom; hub keeps normal zoom', async ({ page }) => {
    await page.goto('/')
    expect(await zoomBlocked(page)).toEqual({ pinch: false, oneFinger: false, gesture: false, locked: false })
    await page.goto('/#/stroke-tracer')
    await expect(page.getByText('What will you draw with?')).toBeVisible()
    expect(await zoomBlocked(page)).toEqual({ pinch: true, oneFinger: false, gesture: true, locked: true })
    await page.getByRole('button', { name: /^Finger/ }).click()
    expect(await zoomBlocked(page)).toEqual({ pinch: true, oneFinger: false, gesture: true, locked: true })
    await page.getByRole('link', { name: '← Trials' }).click()
    await expect(page.getByRole('heading', { name: 'Turtle Academy trials' })).toBeVisible()
    expect(await zoomBlocked(page)).toEqual({ pinch: false, oneFinger: false, gesture: false, locked: false })
  })

  test('one-finger touches on the board belong to the board; touches elsewhere keep page behaviour', async ({ page }) => {
    await openTrial(page, 'Finger')
    const cancelled = (selector: string) => page.evaluate((selector) => {
      const target = document.querySelector(selector)!
      const touch = new Touch({ identifier: 1, target, clientX: 10, clientY: 10 })
      const event = new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] })
      target.dispatchEvent(event)
      return event.defaultPrevented
    }, selector)
    for (const mode of ['Watch', 'Free trace', 'Guided (experimental)']) {
      await page.getByRole('button', { name: mode, exact: true }).click()
      expect(await cancelled('[data-testid=stroke-board]'), mode).toBe(true)
      expect(await cancelled('.t-header'), mode).toBe(false)
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid=stroke-surface]')!).touchAction), mode).toBe('none')
    }
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).touchAction)).toBe('manipulation')
    // Drawing still works with the touch defaults cancelled.
    await page.getByRole('button', { name: 'Free trace' }).click()
    await pointerStroke(page, 7, 'touch', diagonal, 12)
    expect(await inkCount(page)).toBe(1)
  })

  test('pull-to-refresh is blocked on the trial page only; scrolling still works', async ({ page }) => {
    // Returns whether a one-finger drag from y=300 to `toY` had its default prevented.
    const dragBlocked = (toY: number) => page.evaluate((toY) => {
      window.scrollTo(0, 0)
      const touch = (y: number) => new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: y })
      const fire = (type: string, y: number) => {
        const t = touch(y)
        const event = new TouchEvent(type, { bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] })
        document.body.dispatchEvent(event)
        return event.defaultPrevented
      }
      fire('touchstart', 300)
      return fire('touchmove', toY)
    }, toY)
    await page.goto('/')
    expect(await dragBlocked(400)).toBe(false)
    await openTrial(page, 'Finger')
    expect(await dragBlocked(400)).toBe(true)
    expect(await dragBlocked(200)).toBe(false)
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe('none')
  })

  test('landscape board stays clear of the left-edge back-swipe zone', async ({ page }) => {
    for (const viewport of [{ width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await openTrial(page, 'Finger')
      const box = (await page.getByTestId('stroke-board').boundingBox())!
      expect(box.x, viewport.width + 'x' + viewport.height).toBeGreaterThanOrEqual(40)
    }
  })
})
