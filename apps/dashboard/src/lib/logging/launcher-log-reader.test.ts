import { describe, expect, it } from 'vitest'
import { parseLauncherLogLine } from './launcher-log-reader.ts'

describe('launcher-log-reader (RC-20)', () => {
  it('parseLauncherLogLine parses ISO timestamp lines', () => {
    const item = parseLauncherLogLine('[2026-06-30T12:00:00.000Z] Starting server', 1)
    expect(item).not.toBeNull()
    expect(item?.source).toBe('launcher')
    expect(item?.domain).toBe('launcher')
    expect(item?.message).toBe('Starting server')
    expect(item?.level).toBe('info')
  })

  it('parseLauncherLogLine marks failures as error', () => {
    const item = parseLauncherLogLine('[2026-06-30T12:00:00.000Z] pnpm exited with 1', 2)
    expect(item?.level).toBe('error')
  })

  it('returns null for invalid lines', () => {
    expect(parseLauncherLogLine('', 0)).toBeNull()
    expect(parseLauncherLogLine('no timestamp here', 0)).toBeNull()
  })
})
