import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const script = resolve('scripts/check-public-bundle.mjs')
test('public artifact scanner checks lazy chunks and catches every private code marker', () => {
  const root = mkdtempSync(join(tmpdir(), 'public-bundle-'))
  try {
    mkdirSync(join(root, 'assets'))
    writeFileSync(join(root, 'index.html'), '<html>Public</html>')
    for (const marker of ['turtle-academy-private-', 'DexiePrivateStore', 'MistakeProgram', 'mistake-pack', 'mistake-export']) {
      writeFileSync(join(root, 'assets', 'lazy.js'), marker)
      assert.notEqual(spawnSync(process.execPath, [script, root]).status, 0)
    }
    writeFileSync(join(root, 'assets', 'lazy.js'), 'public curriculum')
    assert.equal(spawnSync(process.execPath, [script, root]).status, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
