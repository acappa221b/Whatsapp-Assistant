import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(CURRENT_DIR, '../../../..')

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(path)
}

export function resolveRepoRelativePath(relativePath: string): string {
  const normalized = relativePath.trim()
  if (isAbsolutePath(normalized)) {
    return resolve(normalized)
  }
  const withoutDot = normalized.replace(/^\.\//, '')
  return resolve(REPO_ROOT, withoutDot)
}

export function resolveDatabaseUrl(databaseUrl: string): string {
  const trimmed = databaseUrl.trim()
  const filePrefix = 'file:'
  if (!trimmed.startsWith(filePrefix)) {
    return trimmed
  }

  const pathPart = trimmed.slice(filePrefix.length)
  if (pathPart.startsWith('///')) {
    return trimmed
  }
  if (pathPart.startsWith('//') && /^\/\/[a-zA-Z]:/.test(pathPart)) {
    return trimmed
  }

  const absolutePath = resolveRepoRelativePath(pathPart)
  return `${filePrefix}${absolutePath.replace(/\\/g, '/')}`
}

export function parseSqliteFilePath(databaseUrl: string): string {
  const trimmed = databaseUrl.trim()
  if (!trimmed.startsWith('file:')) {
    throw new Error(`Unsupported database URL for SQLite diagnostics: ${trimmed}`)
  }

  const pathPart = trimmed.slice('file:'.length)
  if (pathPart.startsWith('///')) {
    return pathPart.slice(2)
  }
  if (pathPart.startsWith('//') && /^\/\/[a-zA-Z]:/.test(pathPart)) {
    return pathPart.slice(2)
  }
  if (isAbsolutePath(pathPart)) {
    return resolve(pathPart)
  }
  return resolveRepoRelativePath(pathPart)
}

export function sqliteDatabaseExists(databaseUrl: string): boolean {
  try {
    return existsSync(parseSqliteFilePath(databaseUrl))
  } catch {
    return false
  }
}
