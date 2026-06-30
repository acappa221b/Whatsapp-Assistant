import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { REPO_ROOT } from '../config/paths'

export type AppVersionManifest = {
  version: string
  appName: string
  github?: { owner: string; repo: string; branch?: string }
  releasedAt?: string
  releaseNotes?: string
}

let cached: AppVersionManifest | null = null

export function readAppVersionManifest(): AppVersionManifest {
  if (cached) return cached
  const path = resolve(REPO_ROOT, 'version.json')
  if (!existsSync(path)) {
    return { version: '0.0.0-dev', appName: 'WhatsApp Assistant' }
  }
  cached = JSON.parse(readFileSync(path, 'utf-8')) as AppVersionManifest
  return cached
}

export function getAppVersion(): string {
  return readAppVersionManifest().version
}

export function resetAppVersionCache(): void {
  cached = null
}
