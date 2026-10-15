import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// Build-output boundary checks (Issue #8). Run after `npm run build` (app) and
// `npm run build:trials` (started by the trials web server).
const root = new URL('../../', import.meta.url).pathname

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

// Strings that only exist in trial code or trial data.
const TRIAL_MARKERS = ['stroke-board', 'Turtle Academy trials', 'Reference strokes completed', 'Arphic', 'M 475 485 Q 547 653']
// Strings that only exist in learner-app persistence, auth or offline code.
const APP_MARKERS = ['turtle-academy-guest-v1', 'serviceWorker.register', 'workbox', 'manifest.webmanifest']

test('app build contains no trial entry, code, data or precache entries', () => {
  const dist = join(root, 'dist')
  expect(existsSync(dist), 'run npm run build first').toBe(true)
  const found: string[] = []
  for (const file of files(dist)) {
    const relative = file.slice(dist.length + 1)
    if (/trial/i.test(relative)) found.push('path ' + relative)
    if (!/\.(js|css|html|webmanifest|json)$/.test(file)) continue
    const text = readFileSync(file, 'utf8')
    for (const marker of TRIAL_MARKERS) if (text.includes(marker)) found.push(marker + ' in ' + relative)
    if (/trials?\//.test(text) && relative === 'sw.js') found.push('trial path in precache')
  }
  expect(found).toEqual([])
})

test('trials build has no service worker, manifest, storage or product code', () => {
  const dist = join(root, 'dist-trials')
  expect(existsSync(dist), 'trials build missing').toBe(true)
  const all = files(dist).map((file) => file.slice(dist.length + 1))
  expect(all.filter((f) => /(^|\/)(sw|workbox-[^/]*|registerSW)\.js$|\.webmanifest$/.test(f))).toEqual([])
  expect(all).toContain('index.html')
  const found: string[] = []
  for (const relative of all) {
    if (!/\.(js|css|html)$/.test(relative)) continue
    const text = readFileSync(join(dist, relative), 'utf8')
    for (const marker of [...APP_MARKERS, 'indexedDB', 'localStorage', 'sessionStorage']) {
      if (text.includes(marker)) found.push(marker + ' in ' + relative)
    }
  }
  expect(found).toEqual([])
})

test('trials distribution retains the unchanged character-data licence', () => {
  const source = readFileSync(join(root, 'src/trials/stroke-tracer/data/ARPHICPL.TXT'))
  const shipped = readFileSync(join(root, 'dist-trials/licences/ARPHICPL.TXT'))
  expect(shipped.equals(source)).toBe(true)
})

test('learner app source never imports trial code', () => {
  const offenders = files(join(root, 'src'))
    .filter((file) => !file.includes('/src/trials/') && /\.(ts|tsx)$/.test(file))
    .filter((file) => /from ['"][^'"]*trials/.test(readFileSync(file, 'utf8')))
  expect(offenders).toEqual([])
})

test('trial source never imports learner-app storage, auth or PWA code', () => {
  const offenders = files(join(root, 'src/trials'))
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => /from ['"](\.\.\/)+(storage|App|main)['"]|virtual:pwa|dexie|supabase/.test(readFileSync(file, 'utf8')))
  expect(offenders).toEqual([])
})
