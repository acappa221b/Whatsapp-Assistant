import { defineConfig } from 'prisma/config'
import { applyConfigToProcessEnv, createConfigWithOverrides } from '@finance-ai/shared/config'

applyConfigToProcessEnv(
  createConfigWithOverrides({
    OPENAI_API_KEY: 'prisma-config-placeholder',
  }),
)

const prismaConfig = createConfigWithOverrides({
  OPENAI_API_KEY: 'prisma-config-placeholder',
})
process.env.DATABASE_URL = prismaConfig.database.url

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
