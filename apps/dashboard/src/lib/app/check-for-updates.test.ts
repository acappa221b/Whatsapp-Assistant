import { describe, expect, it, vi, beforeEach } from 'vitest'
import { compareVersions, isNewerVersion } from '@finance-ai/shared/version'

describe('check-for-updates logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('detects newer remote version', () => {
    expect(isNewerVersion('1.5.0-rc19', '1.5.0-rc18')).toBe(true)
    expect(compareVersions('1.5.0-rc19', '1.5.0-rc18')).toBe(1)
  })

  it('treats same version as not newer', () => {
    expect(isNewerVersion('1.5.0-rc18', '1.5.0-rc18')).toBe(false)
  })
})
