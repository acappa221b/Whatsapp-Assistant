import { describe, expect, it } from 'vitest'
import { compareVersions, isNewerVersion, parseVersion } from './compare-versions'

describe('compareVersions', () => {
  it('compares rc suffixes', () => {
    expect(compareVersions('1.5.0-rc18', '1.5.0-rc19')).toBe(-1)
    expect(compareVersions('1.5.0-rc19', '1.5.0-rc18')).toBe(1)
  })

  it('compares minor releases', () => {
    expect(compareVersions('1.4.9', '1.5.0')).toBe(-1)
    expect(compareVersions('1.5.0', '1.4.9')).toBe(1)
  })

  it('treats release without rc as newer than rc', () => {
    expect(compareVersions('1.5.0-rc18', '1.5.0')).toBe(-1)
  })

  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.5.0-rc18', '1.5.0-rc18')).toBe(0)
  })

  it('does not treat older remote as newer when local has rc letter suffix (RC-24 bug)', () => {
    expect(isNewerVersion('1.5.3-rc21', '1.6.1-rc18b')).toBe(false)
    expect(isNewerVersion('1.6.2-rc24', '1.6.1-rc18b')).toBe(true)
  })

  it('compares rc letter suffixes lexicographically', () => {
    expect(compareVersions('1.6.1-rc18a', '1.6.1-rc18b')).toBe(-1)
    expect(compareVersions('1.6.1-rc18b', '1.6.1-rc18b')).toBe(0)
  })

  it('parses rc letter suffix versions', () => {
    expect(parseVersion('1.6.1-rc18b')).toEqual({
      major: 1,
      minor: 6,
      patch: 1,
      prerelease: { kind: 'rc', rc: 18, suffix: 'b' },
    })
  })

  it('returns null for invalid versions instead of 0.0.0', () => {
    expect(parseVersion('totally-invalid')).toBeNull()
    expect(isNewerVersion('1.0.0', 'totally-invalid')).toBe(false)
    expect(compareVersions('1.0.0', 'totally-invalid')).toBeNull()
  })

  it('parses dev tag versions', () => {
    expect(parseVersion('0.0.0-dev')).toEqual({
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: { kind: 'tag', tag: 'dev' },
    })
  })
})
