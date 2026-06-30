import type { AppVersionManifest } from '../version/read-app-version'

export type AppVersionManifestExtended = AppVersionManifest & {
  minLauncherVersion?: number
}

export type UpdateCheckResult = {
  localVersion: string
  remoteVersion: string | null
  remoteManifest: AppVersionManifestExtended | null
  updateAvailable: boolean
  releaseNotes: string | null
  checkError?: string
  cached: boolean
}

export type UpdateApplyResult = {
  updated: boolean
  version?: string
  method?: 'git' | 'zip'
  reason?: string
  error?: string
  commits?: number
  filesUpdated?: number
}
