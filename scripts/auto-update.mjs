#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function log(message) {
  console.log(message)
}

function commandExists(command) {
  try {
    const check = process.platform === 'win32' ? 'where' : 'which'
    execSync(`${check} ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function readVersionJson() {
  const path = join(ROOT, 'version.json')
  if (!existsSync(path)) return '0.0.0-dev'
  const manifest = JSON.parse(readFileSync(path, 'utf-8'))
  return manifest.version ?? '0.0.0-dev'
}

function readBranch() {
  if (process.env.WA_BRANCH?.trim()) return process.env.WA_BRANCH.trim()
  const manifestPath = join(ROOT, 'version.json')
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      if (manifest.github?.branch) return manifest.github.branch
    } catch {
      // ignore
    }
  }
  return 'main'
}

export async function autoUpdate() {
  const gitDir = join(ROOT, '.git')
  if (!existsSync(gitDir)) {
    log('No .git folder - skip auto-update (manual download mode)')
    return { updated: false, reason: 'no-git' }
  }
  if (!commandExists('git')) {
    log('Git not installed - skip auto-update')
    return { updated: false, reason: 'no-git-cli' }
  }

  const branch = readBranch()
  log(`Checking updates from origin/${branch}...`)

  try {
    execSync('git fetch origin', { cwd: ROOT, stdio: 'pipe' })
    const behind = execSync(`git rev-list HEAD..origin/${branch} --count`, {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim()

    if (behind === '0') {
      log('Already up to date')
      return { updated: false, version: readVersionJson() }
    }

    log(`Updating ${behind} commit(s)...`)
    execSync(`git pull --ff-only origin ${branch}`, { cwd: ROOT, stdio: 'inherit' })
    const newVersion = readVersionJson()
    log('')
    log('============================================')
    log(`  Programa atualizado! Versao: ${newVersion}`)
    log('============================================')
    log('')
    return { updated: true, version: newVersion, commits: Number(behind) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Auto-update skipped: ${message}`)
    return { updated: false, reason: 'pull-failed', error: message, version: readVersionJson() }
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  autoUpdate().then((result) => {
    process.exit(result.updated ? 0 : 0)
  })
}
