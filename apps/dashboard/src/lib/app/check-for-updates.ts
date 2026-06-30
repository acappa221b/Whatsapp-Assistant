import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  readAppVersionManifest,
  type AppVersionManifest,
} from '@finance-ai/shared/version'
import {
  isUpdateAvailable,
  rawVersionUrl,
  releasesPageUrl,
} from '@finance-ai/shared/update'
import { REPO_ROOT } from '@finance-ai/shared/config'
import { settingsRepo } from '@/lib/ai/ai-provider-service'
import { readLocalUpdateState } from './read-update-state'

export type UpdateMethod = 'restart_launcher' | 'zip_overlay' | 'manual_download'

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
  canAutoUpdateOnRestart: boolean
  lastLocalUpdateAt: string | null
  lastLocalUpdateMethod: 'git' | 'zip' | null
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

function resolveUpdateMethod(checkError?: string): UpdateMethod {
  if (checkError) return 'manual_download'
  if (hasGitRepo()) return 'restart_launcher'
  return 'zip_overlay'
}

async function fetchRemoteManifest(
  local: AppVersionManifest,
  force: boolean,
): Promise<{ remote: AppVersionManifest | null; error?: string }> {
  const now = Date.now()
  if (!force && remoteCache && now - remoteCache.fetchedAt < CACHE_TTL_MS) {
    return { remote: remoteCache.manifest, error: remoteCache.error }
  }

  const github = local.github
  if (!github?.owner || !github?.repo) {
    remoteCache = { fetchedAt: now, manifest: null, error: 'no-github-config' }
    return { remote: null, error: 'no-github-config' }
  }

  const branch = github.branch ?? 'main'
  const url = rawVersionUrl(github.owner, github.repo, branch)

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
  const localUpdate = readLocalUpdateState()
  const gitRepo = hasGitRepo()

  if (!settings.updateCheckEnabled && !options?.force) {
    return {
      version: local.version,
      appName: local.appName,
      github: local.github,
      updateAvailable: false,
      latestVersion: null,
      releaseNotes: null,
      updateMethod: gitRepo ? 'restart_launcher' : 'zip_overlay',
      downloadUrl:
        local.github?.owner && local.github?.repo
          ? releasesPageUrl(local.github.owner, local.github.repo)
          : null,
      checkedAt: checkedAt.toISOString(),
      bannerDismissed: false,
      hasGitRepo: gitRepo,
      canAutoUpdateOnRestart: !gitRepo || gitRepo,
      lastLocalUpdateAt: localUpdate?.updatedAt ?? settings.lastSuccessfulUpdateAt?.toISOString() ?? null,
      lastLocalUpdateMethod: localUpdate?.method ?? null,
    }
  }

  const { remote, error } = await fetchRemoteManifest(local, Boolean(options?.force))
  const latestVersion = remote?.version ?? null
  const updateAvailable =
    latestVersion !== null && isUpdateAvailable(local.version, latestVersion)

  if (options?.force || updateAvailable || error) {
    await settingsRepo.update({ lastUpdateCheckAt: checkedAt })
  }

  const bannerDismissed =
    Boolean(latestVersion) &&
    settings.dismissedUpdateVersion === latestVersion &&
    updateAvailable

  const updateMethod = resolveUpdateMethod(error)
  const canAutoUpdateOnRestart = !error && updateMethod !== 'manual_download'

  return {
    version: local.version,
    appName: local.appName,
    github: local.github,
    updateAvailable,
    latestVersion,
    releaseNotes: remote?.releaseNotes ?? null,
    updateMethod,
    downloadUrl: local.github ? releasesPageUrl(local.github.owner, local.github.repo) : null,
    checkedAt: checkedAt.toISOString(),
    checkError: error,
    bannerDismissed,
    hasGitRepo: gitRepo,
    canAutoUpdateOnRestart,
    lastLocalUpdateAt: localUpdate?.updatedAt ?? settings.lastSuccessfulUpdateAt?.toISOString() ?? null,
    lastLocalUpdateMethod: localUpdate?.method ?? null,
  }
}

export function resetUpdateCheckCache(): void {
  remoteCache = null
}
