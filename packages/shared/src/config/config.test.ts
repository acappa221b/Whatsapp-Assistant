import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createConfig, REPO_ROOT } from './index'

describe('config', () => {
  it('applies defaults without .env file', () => {
    const resolved = createConfig(
      {
        NODE_ENV: 'test',
        DATABASE_URL: 'file:./test.db',
      },
      { overridesOnly: true },
    )

    expect(resolved.app.port).toBe(4000)
    expect(resolved.openai.apiKey).toBe('')
    expect(resolved.whatsapp.autoReconnect).toBe(true)
  })

  it('does not require OPENAI_API_KEY in production', () => {
    const resolved = createConfig(
      {
        NODE_ENV: 'production',
        DATABASE_URL: 'file:./dev.db',
      },
      { overridesOnly: true },
    )
    expect(resolved.openai.apiKey).toBe('')
  })

  it('validates zod numeric and boolean fields', () => {
    const resolved = createConfig(
      {
        NODE_ENV: 'test',
        DATABASE_URL: 'file:./test.db',
        PORT: '4100',
        LOG_PRETTY_PRINT: 'false',
        AUDIT_RETENTION_DAYS: '30',
      },
      { overridesOnly: true },
    )

    expect(resolved.app.port).toBe(4100)
    expect(resolved.logging.prettyPrint).toBe(false)
    expect(resolved.app.auditRetentionDays).toBe(30)
  })

  it('starts without .env.example', () => {
    expect(existsSync(resolve(REPO_ROOT, '.env.example'))).toBe(false)
  })

  it('throws explicit error for invalid values', () => {
    expect(() =>
      createConfig(
        {
          NODE_ENV: 'test',
          DATABASE_URL: 'file:./test.db',
          PORT: 'abc',
        },
        { overridesOnly: true },
      ),
    ).toThrow(/Invalid numeric value: abc/)
  })
})
