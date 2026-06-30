import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { zipArchiveUrl } from './lib/github-sources.mjs'
import {
  applyOverlay,
  backupFilesForOverlay,
  detectExtractRoot,
} from './apply-overlay.mjs'
import { createBackupDir, rollbackUpdate } from './rollback-update.mjs'

function readLocalManifest(root) {
  return JSON.parse(readFileSync(join(root, 'version.json'), 'utf-8'))
}

async function downloadFile(url, dest, log) {
  log(`[1/4] Baixando atualizacao do GitHub...`)
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`)
  }
  mkdirSync(join(dest, '..'), { recursive: true })
  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(dest, buffer)
  const mb = (buffer.length / (1024 * 1024)).toFixed(1)
  log(`Download complete (${mb} MB)`)
}

function extractZip(zipPath, extractDir, log) {
  log(`[2/4] Extraindo arquivos...`)
  mkdirSync(extractDir, { recursive: true })
  if (process.platform === 'win32') {
    const ps = [
      `$ProgressPreference = 'SilentlyContinue'`,
      `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`,
    ].join('; ')
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, {
      stdio: 'inherit',
    })
    return
  }
  execSync(`tar -xf "${zipPath}" -C "${extractDir}"`, { stdio: 'inherit' })
}

function cleanupArtifacts(root) {
  const zipPath = join(root, 'logs', 'update-download.zip')
  const extractDir = join(root, 'logs', 'update-extract')
  if (existsSync(zipPath)) rmSync(zipPath, { force: true })
  if (existsSync(extractDir)) rmSync(extractDir, { recursive: true, force: true })
}

export async function updateViaZip(root, check, log = console.log) {
  const manifest = readLocalManifest(root)
  const github = manifest.github
  if (!github?.owner || !github?.repo) {
    return { updated: false, reason: 'no-github-config' }
  }

  const branch = process.env.WA_BRANCH?.trim() || github.branch || 'main'
  const url = zipArchiveUrl(github.owner, github.repo, branch)
  const zipPath = join(root, 'logs', 'update-download.zip')
  const extractDir = join(root, 'logs', 'update-extract')
  const backupDir = createBackupDir(root)

  try {
    await downloadFile(url, zipPath, log)
    extractZip(zipPath, extractDir, log)

    const sourceRoot = detectExtractRoot(extractDir)
    log(`[3/4] Aplicando arquivos (seus dados estao seguros)...`)
    backupFilesForOverlay(sourceRoot, root, backupDir, log)
    const { copied } = applyOverlay(sourceRoot, root, log)

    const newVersion = check.remoteVersion ?? readLocalManifest(root).version
    log(`[4/4] Concluido! Versao ${newVersion}`)
    cleanupArtifacts(root)

    return {
      updated: true,
      version: newVersion,
      method: 'zip',
      filesUpdated: copied,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`ZIP update failed: ${message}`)
    log('Restaurando backup...')
    rollbackUpdate(root, backupDir, log)
    cleanupArtifacts(root)
    return { updated: false, reason: 'zip-failed', error: message, version: manifest.version }
  }
}
