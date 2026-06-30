import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from '@finance-ai/shared/config'

export type LocalUpdateState = {
  version: string
  method: 'git' | 'zip'
  updatedAt: string
}

export function readLocalUpdateState(): LocalUpdateState | null {
  const path = join(REPO_ROOT, 'storage', '.update-state.json')
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as LocalUpdateState
  } catch {
    return null
  }
}
