import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createConfig, REPO_ROOT } from './index'

describe('config', () => {
  it('applies defaults', () => {
    const resolved = createConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      OPENAI_API_KEY: 'test-openai-key',
    })

    expect(resolved.app.port).toBe(4000)
    expect(resolved.openai.model).toBe('gpt-5-mini')
    expect(resolved.whatsapp.autoReconnect).toBe(true)
  })

  it('requires OPENAI_API_KEY in production', () => {
    expect(() =>
      createConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'file:./dev.db',
        OPENAI_API_KEY: '',
      }).openai.apiKey,
    ).toThrow(/OPENAI_API_KEY is required/)
  })

  it('validates zod numeric and boolean fields', () => {
    const resolved = createConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      OPENAI_API_KEY: 'test-openai-key',
      PORT: '4100',
      LOG_PRETTY_PRINT: 'false',
      AUDIT_RETENTION_DAYS: '30',
    })

    expect(resolved.app.port).toBe(4100)
    expect(resolved.logging.prettyPrint).toBe(false)
    expect(resolved.app.auditRetentionDays).toBe(30)
  })

  it('merges root env file when DATABASE_URL is preset in process env', () => {
    if (!existsSync(resolve(REPO_ROOT, '.env'))) {
      return
    }

    const withFile = createConfig(
      {
        NODE_ENV: 'test',
        DATABASE_URL: 'file:./packages/database/prisma/dev.db',
      },
      { skipEnvFile: false },
    )
    const withoutFile = createConfig(
      {
        NODE_ENV: 'test',
        DATABASE_URL: 'file:./packages/database/prisma/dev.db',
        OPENAI_API_KEY: '',
      },
      { skipEnvFile: true },
    )

    expect(withFile.openai.apiKey.length).toBeGreaterThan(0)
    expect(withoutFile.openai.apiKey).toBe('')
  })

  it('throws explicit error for invalid values', () => {
    expect(() =>
      createConfig({
        NODE_ENV: 'test',
        DATABASE_URL: 'file:./test.db',
        OPENAI_API_KEY: 'test-openai-key',
        PORT: 'abc',
      }),
    ).toThrow(/Invalid numeric value: abc/)
  })
})
