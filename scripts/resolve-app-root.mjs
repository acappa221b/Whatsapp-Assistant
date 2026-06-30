import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function resolveAppRoot(importMetaUrl) {
  const fromEnv = process.env.WA_APP_ROOT?.trim()
  if (fromEnv) return resolve(fromEnv)
  return resolve(dirname(fileURLToPath(importMetaUrl)), '..')
}

export function isUncPath(filePath) {
  return process.platform === 'win32' && filePath.startsWith('\\\\')
}
