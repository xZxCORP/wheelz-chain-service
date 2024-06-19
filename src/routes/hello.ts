import { Hono } from 'hono'

import { HelloService } from '../services/hello.js'
const helloService = new HelloService()
export const helloRouter = new Hono()

helloRouter.get('/', (c) => {
  const response = helloService.hello()
  return c.json({ hello: response })
})
