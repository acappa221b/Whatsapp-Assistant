import { isProtectedRelativePath } from './protected-paths'

export function sanitizeUpdateRelativePath(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
  if (!normalized || normalized.includes('..') || normalized.startsWith('/')) {
    return null
  }
  const segments = normalized.split('/')
  if (segments.some((segment) => segment === '..')) return null
  return normalized
}

export function canCopyUpdatePath(relativePath: string): boolean {
  const safe = sanitizeUpdateRelativePath(relativePath)
  if (!safe) return false
  return !isProtectedRelativePath(safe)
}
