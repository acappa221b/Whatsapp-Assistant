export const USER_DATA_PATHS = [
  'storage',
  'logs',
  'backups',
  'tools/node',
  'node_modules',
  '.pnpm-store',
  'packages/database/prisma/dev.db',
  'packages/database/prisma/*.db',
  'packages/database/prisma/*.db-journal',
  'packages/database/prisma/*.db-wal',
  'packages/database/prisma/*.db-shm',
  '.env',
  '.update-backup',
  'storage/.update-state.json',
]

function globToRegExp(pattern) {
  const escaped = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*')
  return new RegExp(`^${escaped}$`)
}

export function isProtectedRelativePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
  if (!normalized || normalized.includes('..')) return true
  for (const pattern of USER_DATA_PATHS) {
    if (pattern.includes('*')) {
      if (globToRegExp(pattern).test(normalized)) return true
      continue
    }
    if (normalized === pattern || normalized.startsWith(`${pattern}/`)) return true
  }
  return false
}

export function canCopyUpdatePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
  if (!normalized || normalized.includes('..')) return false
  return !isProtectedRelativePath(normalized)
}
