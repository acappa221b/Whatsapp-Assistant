import { describe, expect, it } from 'vitest'
import { isProtectedRelativePath, USER_DATA_PATHS } from './protected-paths'

describe('protected-paths', () => {
  it('lists storage and database globs', () => {
    expect(USER_DATA_PATHS).toContain('storage')
    expect(USER_DATA_PATHS.some((p) => p.includes('*.db'))).toBe(true)
  })

  it('protects storage tree', () => {
    expect(isProtectedRelativePath('storage')).toBe(true)
    expect(isProtectedRelativePath('storage/whatsapp/session')).toBe(true)
    expect(isProtectedRelativePath('storage/.update-state.json')).toBe(true)
  })

  it('protects sqlite files via glob', () => {
    expect(isProtectedRelativePath('packages/database/prisma/dev.db')).toBe(true)
    expect(isProtectedRelativePath('packages/database/prisma/prod.db-wal')).toBe(true)
  })

  it('allows application source files', () => {
    expect(isProtectedRelativePath('package.json')).toBe(false)
    expect(isProtectedRelativePath('apps/dashboard/src/app/page.tsx')).toBe(false)
  })
})
