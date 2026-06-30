import { describe, expect, it } from 'vitest'
import {
  inferDomainFromMessage,
  inferLauncherLogLevel,
  normalizeConsoleArgs,
  sanitizeLogMessage,
  shouldPersistConsoleMessage,
} from './app-logger.ts'

describe('app-logger (RC-20)', () => {
  it('sanitizeLogMessage masks API keys', () => {
    expect(sanitizeLogMessage('key sk-abcdefghijklmnop')).toContain('sk-****')
    expect(sanitizeLogMessage('gemini AIzaSyTestGeminiKey1234567890')).toContain('AIza****')
    expect(sanitizeLogMessage('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9')).toContain('Bearer ****')
    expect(sanitizeLogMessage('{"apiKey":"secret-value"}')).toContain('"apiKey":"****"')
  })

  it('inferDomainFromMessage maps known prefixes', () => {
    expect(inferDomainFromMessage('[baileys] connect failed')).toBe('whatsapp')
    expect(inferDomainFromMessage('[assistant/chat] reply')).toBe('assistant')
    expect(inferDomainFromMessage('[DailyReport] generated')).toBe('jobs')
    expect(inferDomainFromMessage('[settings/providers POST] error')).toBe('api')
    expect(inferDomainFromMessage('random message')).toBe('system')
  })

  it('inferLauncherLogLevel detects errors', () => {
    expect(inferLauncherLogLevel('pnpm install exited with 1')).toBe('error')
    expect(inferLauncherLogLevel('Starting server')).toBe('info')
  })

  it('normalizeConsoleArgs builds message and metadata', () => {
    const err = new Error('boom')
    const result = normalizeConsoleArgs(['[baileys] fail', err])
    expect(result.message).toContain('fail')
    expect(result.metadata).toBeDefined()
  })

  it('shouldPersistConsoleMessage skips prisma and AppLog noise', () => {
    expect(shouldPersistConsoleMessage('prisma:query INSERT INTO AppLog')).toBe(false)
    expect(shouldPersistConsoleMessage('[baileys] connect failed')).toBe(true)
    expect(shouldPersistConsoleMessage('')).toBe(false)
  })
})
