import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),
})
const parsedConfig = configSchema.safeParse(process.env)

if (!parsedConfig.success) {
  throw new Error('Invalid configuration')
}

export const config = parsedConfig.data
