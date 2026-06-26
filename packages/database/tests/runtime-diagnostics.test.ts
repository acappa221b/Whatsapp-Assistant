import { describe, expect, it } from 'vitest'
import { getRuntimeDatabaseDiagnostics } from '../src/runtime-diagnostics'
import { createConfig } from '@finance-ai/shared/config'

describe('runtime diagnostics', () => {
  it('reports canonical sqlite path metadata', () => {
    const config = createConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./packages/database/prisma/dev.db',
      OPENAI_API_KEY: 'test-openai-key',
    })

    const diagnostics = getRuntimeDatabaseDiagnostics(config.database.url)
    expect(diagnostics.absolutePath.replace(/\\/g, '/')).toContain('packages/database/prisma/dev.db')
    expect(typeof diagnostics.exists).toBe('boolean')
    expect(diagnostics.sizeBytes).toBeGreaterThanOrEqual(0)
  })
})
