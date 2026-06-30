import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  compareVersions,
  readAppVersionManifest,
  type AppVersionManifest,
} from '@finance-ai/shared/version'
import { REPO_ROOT } from '@finance-ai/shared/config'
import { settingsRepo } from '@/lib/ai/ai-provider-service'

export type UpdateMethod = 'restart_launcher' | 'manual_download'

export type VersionCheckResult = {
  version: string
  appName: string
  github?: AppVersionManifest['github']
  updateAvailable: boolean
  latestVersion: string | null
  releaseNotes: string | null
  updateMethod: UpdateMethod
  downloadUrl: string | null
  checkedAt: string
  checkError?: string
  bannerDismissed: boolean
  hasGitRepo: boolean
}

type RemoteCache = {
  fetchedAt: number
  manifest: AppVersionManifest | null
  error?: string
}

const CACHE_TTL_MS = 60 * 60 * 1000
let remoteCache: RemoteCache | null = null

function hasGitRepo(): boolean {
  return existsSync(join(REPO_ROOT, '.git'))
}

function githubRawUrl(manifest: AppVersionManifest): string | null {
  const github = manifest.github
  if (!github?.owner || !github?.repo) return null
  const branch = github.branch ?? 'main'
  return `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${branch}/version.json`
}

function releasesUrl(manifest: AppVersionManifest): string | null {
  const github = manifest.github
  if (!github?.owner || !github?.repo) return null
  return `https://github.com/${github.owner}/${github.repo}/releases`
}

async function fetchRemoteManifest(
  local: AppVersionManifest,
  force: boolean,
): Promise<{ remote: AppVersionManifest | null; error?: string }> {
  const now = Date.now()
  if (!force && remoteCache && now - remoteCache.fetchedAt < CACHE_TTL_MS) {
    return { remote: remoteCache.manifest, error: remoteCache.error }
  }

  const url = githubRawUrl(local)
  if (!url) {
    remoteCache = { fetchedAt: now, manifest: null, error: 'no-github-config' }
    return { remote: null, error: 'no-github-config' }
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const remote = (await response.json()) as AppVersionManifest
    remoteCache = { fetchedAt: now, manifest: remote }
    return { remote }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    remoteCache = { fetchedAt: now, manifest: null, error: message }
    return { remote: null, error: message }
  }
}

export async function checkForUpdates(options?: { force?: boolean }): Promise<VersionCheckResult> {
  const local = readAppVersionManifest()
  const settings = await settingsRepo.get()
  const checkedAt = new Date()

  if (!settings.updateCheckEnabled && !options?.force) {
    return {
      version: local.version,
      appName: local.appName,
      github: local.github,
      updateAvailable: false,
      latestVersion: null,
      releaseNotes: null,
      updateMethod: hasGitRepo() ? 'restart_launcher' : 'manual_download',
      downloadUrl: releasesUrl(local),
      checkedAt: checkedAt.toISOString(),
      bannerDismissed: false,
      hasGitRepo: hasGitRepo(),
    }
  }

  const { remote, error } = await fetchRemoteManifest(local, Boolean(options?.force))
  const latestVersion = remote?.version ?? null
  const updateAvailable =
    latestVersion !== null && compareVersions(latestVersion, local.version) > 0

  if (options?.force || updateAvailable || error) {
    await settingsRepo.update({ lastUpdateCheckAt: checkedAt })
  }

  const bannerDismissed =
    Boolean(latestVersion) &&
    settings.dismissedUpdateVersion === latestVersion &&
    updateAvailable

  return {
    version: local.version,
    appName: local.appName,
    github: local.github,
    updateAvailable,
    latestVersion,
    releaseNotes: remote?.releaseNotes ?? null,
    updateMethod: hasGitRepo() ? 'restart_launcher' : 'manual_download',
    downloadUrl: releasesUrl(local),
    checkedAt: checkedAt.toISOString(),
    checkError: error,
    bannerDismissed,
    hasGitRepo: hasGitRepo(),
  }
}

export function resetUpdateCheckCache(): void {
  remoteCache = null
}
