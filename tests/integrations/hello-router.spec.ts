import assert from 'node:assert'
import { describe, it } from 'node:test'

import { app } from '../../src/app.js'

describe('HelloRouter', () => {
  it('should return hello world', async () => {
    const response = await app.request('/hello')
    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(await response.json(), { hello: 'world' })
  })
})
