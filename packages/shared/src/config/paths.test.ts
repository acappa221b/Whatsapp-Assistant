import { describe, expect, it } from 'vitest'
import { resolveDatabaseUrl, resolveRepoRelativePath, REPO_ROOT } from './paths'

describe('paths', () => {
  it('resolves repo-relative storage paths from workspace root', () => {
    const resolved = resolveRepoRelativePath('./packages/database/prisma/dev.db')
    expect(resolved.replace(/\\/g, '/')).toContain('/packages/database/prisma/dev.db')
    expect(resolved.startsWith(REPO_ROOT)).toBe(true)
  })

  it('resolves sqlite database urls to absolute file urls', () => {
    const resolved = resolveDatabaseUrl('file:./packages/database/prisma/dev.db')
    expect(resolved.startsWith('file:')).toBe(true)
    expect(resolved.replace(/\\/g, '/')).toContain('/packages/database/prisma/dev.db')
  })

  it('keeps absolute sqlite urls unchanged', () => {
    const absolute = 'file:C:/data/finance.db'
    expect(resolveDatabaseUrl(absolute)).toBe(absolute)
  })
})
