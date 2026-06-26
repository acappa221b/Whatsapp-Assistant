import { describe, expect, it, beforeEach } from 'vitest'
import { applyConfigToProcessEnv, createConfigWithOverrides, resetConfigCache } from '@finance-ai/shared/config'

describe('GET /api/health', () => {
  beforeEach(() => {
    resetConfigCache()
  })

  it('returns configured app version', async () => {
    applyConfigToProcessEnv(
      createConfigWithOverrides({
        NODE_ENV: 'test',
        DATABASE_URL: 'file:./packages/database/prisma/dev.db',
        OPENAI_API_KEY: 'test-openai-key',
        APP_VERSION: '1.0.5-rc07',
      }),
    )

    const { GET } = await import('./route')
    const response = await GET()
    const body = await response.json()
    expect(body.version).toBe('1.0.5-rc07')
    expect(body.status).toBe('ok')
  })
})
