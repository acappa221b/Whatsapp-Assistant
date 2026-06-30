import { describe, expect, it } from 'vitest'
import { compareVersions } from './compare-versions'

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
})
