import { describe, expect, it } from 'vitest'
import { isUpdateAvailable, compareVersions } from './compare-update'

describe('isUpdateAvailable', () => {
  it('returns true when remote is newer', () => {
    expect(isUpdateAvailable('1.6.0', '1.6.1')).toBe(true)
    expect(isUpdateAvailable('1.6.0-rc22', '1.6.1-rc18b')).toBe(true)
  })

  it('returns false for same or older remote', () => {
    expect(isUpdateAvailable('1.6.1', '1.6.1')).toBe(false)
    expect(isUpdateAvailable('1.6.2', '1.6.1')).toBe(false)
  })

  it('compareVersions orders semver segments', () => {
    expect(compareVersions('1.6.0', '1.6.1')).toBeLessThan(0)
    expect(compareVersions('1.6.1', '1.6.0')).toBeGreaterThan(0)
  })
})
