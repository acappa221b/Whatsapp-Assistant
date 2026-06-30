import { describe, expect, it } from 'vitest'
import { canCopyUpdatePath, sanitizeUpdateRelativePath } from './sanitize-update-path'

describe('sanitize-update-path', () => {
  it('rejects path traversal', () => {
    expect(sanitizeUpdateRelativePath('../storage/foo')).toBeNull()
    expect(sanitizeUpdateRelativePath('apps/../../etc/passwd')).toBeNull()
    expect(canCopyUpdatePath('../package.json')).toBe(false)
  })

  it('accepts normal relative paths', () => {
    expect(sanitizeUpdateRelativePath('scripts/launch.mjs')).toBe('scripts/launch.mjs')
    expect(canCopyUpdatePath('version.json')).toBe(true)
  })

  it('blocks protected destinations', () => {
    expect(canCopyUpdatePath('storage/foo.txt')).toBe(false)
    expect(canCopyUpdatePath('.env')).toBe(false)
  })
})
