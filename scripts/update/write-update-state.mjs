import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function writeUpdateState(root, payload) {
  const storageDir = join(root, 'storage')
  mkdirSync(storageDir, { recursive: true })
  const path = join(storageDir, '.update-state.json')
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
  return path
}

export function readUpdateState(root) {
  const path = join(root, 'storage', '.update-state.json')
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}
