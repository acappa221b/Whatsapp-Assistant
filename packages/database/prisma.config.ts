import { defineConfig } from 'prisma/config'
import { applyConfigToProcessEnv, createConfigWithOverrides } from '@finance-ai/shared/config'

const overrides = process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}
const prismaConfig = createConfigWithOverrides(overrides)
applyConfigToProcessEnv(prismaConfig)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = prismaConfig.database.url
}

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
