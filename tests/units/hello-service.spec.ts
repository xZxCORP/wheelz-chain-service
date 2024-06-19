import assert from 'node:assert'
import { describe, it } from 'node:test'

import { HelloService } from '../../src/services/hello.js'

describe('HelloService', () => {
  it('should return world', () => {
    const service = new HelloService()
    assert.strictEqual(service.hello(), 'world')
  })
})
