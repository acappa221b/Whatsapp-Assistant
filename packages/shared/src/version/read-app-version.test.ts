import { describe, expect, it } from 'vitest'
import { getAppVersion, readAppVersionManifest } from './read-app-version'

describe('readAppVersionManifest', () => {
  it('reads version from root version.json', () => {
    const manifest = readAppVersionManifest()
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(getAppVersion()).toBe(manifest.version)
  })
})
