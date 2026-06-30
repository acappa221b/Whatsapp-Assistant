/** Paths never overwritten during ZIP overlay updates (SSOT). */
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

function normalizeRelativePath(input: string): string {
  return input.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*')
  return new RegExp(`^${escaped}$`)
}

export function isProtectedRelativePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath)
  if (!normalized || normalized.includes('..')) return true

  for (const pattern of USER_DATA_PATHS) {
    if (pattern.includes('*')) {
      if (globToRegExp(pattern).test(normalized)) return true
      continue
    }
    if (normalized === pattern || normalized.startsWith(`${pattern}/`)) {
      return true
    }
  }
  return false
}
