import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { isUpdateAvailable } from './lib/compare-update.mjs'
import { rawVersionUrl } from './lib/github-sources.mjs'

const CACHE_TTL_MS = 15 * 60 * 1000

function readLocalManifest(root) {
  const path = join(root, 'version.json')
  if (!existsSync(path)) {
    return { version: '0.0.0-dev', appName: 'WhatsApp Assistant' }
  }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function readBranch(root) {
  if (process.env.WA_BRANCH?.trim()) return process.env.WA_BRANCH.trim()
  const manifest = readLocalManifest(root)
  return manifest.github?.branch ?? 'main'
}

function cachePath(root) {
  return join(root, 'logs', '.update-cache.json')
}

function readCache(root) {
  const path = cachePath(root)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function writeCache(root, payload) {
  mkdirSync(join(root, 'logs'), { recursive: true })
  writeFileSync(cachePath(root), `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
}

export async function checkRemoteVersion(root, options = {}) {
  const localManifest = readLocalManifest(root)
  const localVersion = localManifest.version ?? '0.0.0-dev'
  const github = localManifest.github

  if (!github?.owner || !github?.repo) {
    return {
      localVersion,
      remoteVersion: null,
      remoteManifest: null,
      updateAvailable: false,
      releaseNotes: null,
      checkError: 'no-github-config',
      cached: false,
    }
  }

  if (!options.force) {
    const cached = readCache(root)
    if (
      cached &&
      cached.localVersion === localVersion &&
      Date.now() - cached.fetchedAt < CACHE_TTL_MS
    ) {
      return {
        localVersion,
        remoteVersion: cached.remoteVersion,
        remoteManifest: cached.remoteManifest,
        updateAvailable: cached.updateAvailable,
        releaseNotes: cached.releaseNotes ?? null,
        cached: true,
      }
    }
  }

  const branch = readBranch(root)
  const url = rawVersionUrl(github.owner, github.repo, branch)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const remoteManifest = await response.json()
    const remoteVersion = remoteManifest.version ?? null
    const updateAvailable =
      remoteVersion !== null && isUpdateAvailable(localVersion, remoteVersion)

    writeCache(root, {
      fetchedAt: Date.now(),
      localVersion,
      remoteVersion,
      remoteManifest,
      updateAvailable,
      releaseNotes: remoteManifest.releaseNotes ?? null,
    })

    return {
      localVersion,
      remoteVersion,
      remoteManifest,
      updateAvailable,
      releaseNotes: remoteManifest.releaseNotes ?? null,
      cached: false,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      localVersion,
      remoteVersion: null,
      remoteManifest: null,
      updateAvailable: false,
      releaseNotes: null,
      checkError: message,
      cached: false,
    }
  }
}
