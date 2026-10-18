import { test } from 'node:test'
import assert from 'node:assert/strict'
import { keepStorage } from '../../src/ui/keep-storage.ts'

test('storage is requested once and every outcome is reported, never assumed', async () => {
  let asked = 0
  assert.equal(await keepStorage({ persisted: async () => true, persist: async () => { asked++; return true } }), 'kept')
  assert.equal(asked, 0, 'already kept: no new request')
  assert.equal(await keepStorage({ persisted: async () => false, persist: async () => { asked++; return true } }), 'kept')
  assert.equal(asked, 1)
  assert.equal(await keepStorage({ persisted: async () => false, persist: async () => false }), 'not_kept')
  assert.equal(await keepStorage({ persisted: async () => { throw new Error('denied') }, persist: async () => true }), 'not_kept')
  assert.equal(await keepStorage(undefined), 'unsupported')
  assert.equal(await keepStorage({}), 'unsupported')
})
