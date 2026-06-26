import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, afterEach } from 'vitest'
import { isValidAuthSession } from './baileys-connection-diagnostic'

const TEST_DIR = join(process.cwd(), 'tmp-auth-session-test')

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('isValidAuthSession', () => {
  it('returns false when directory is missing', () => {
    expect(isValidAuthSession(join(TEST_DIR, 'missing'))).toBe(false)
  })

  it('returns false when directory is empty', () => {
    mkdirSync(TEST_DIR, { recursive: true })
    expect(isValidAuthSession(TEST_DIR)).toBe(false)
  })

  it('returns true when creds.json has me.id', () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(
      join(TEST_DIR, 'creds.json'),
      JSON.stringify({ me: { id: '5511999999999@s.whatsapp.net' } }),
    )
    expect(isValidAuthSession(TEST_DIR)).toBe(true)
  })

  it('returns true when creds.json is registered', () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, 'creds.json'), JSON.stringify({ registered: true }))
    expect(isValidAuthSession(TEST_DIR)).toBe(true)
  })
})
