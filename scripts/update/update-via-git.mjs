import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function commandExists(command) {
  try {
    const check = process.platform === 'win32' ? 'where' : 'which'
    execSync(`${check} ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function readVersionJson(root) {
  const path = join(root, 'version.json')
  if (!existsSync(path)) return '0.0.0-dev'
  return JSON.parse(readFileSync(path, 'utf-8')).version ?? '0.0.0-dev'
}

function readBranch(root, remoteManifest) {
  if (process.env.WA_BRANCH?.trim()) return process.env.WA_BRANCH.trim()
  if (remoteManifest?.github?.branch) return remoteManifest.github.branch
  const local = JSON.parse(readFileSync(join(root, 'version.json'), 'utf-8'))
  return local.github?.branch ?? 'main'
}

function hasLocalChanges(root) {
  try {
    const output = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' })
    return Boolean(output.trim())
  } catch {
    return false
  }
}

export async function updateViaGit(root, check, log = console.log) {
  const gitDir = join(root, '.git')
  if (!existsSync(gitDir)) {
    return { updated: false, reason: 'no-git' }
  }
  if (!commandExists('git')) {
    return { updated: false, reason: 'no-git-cli' }
  }
  if (hasLocalChanges(root)) {
    log('')
    log('Ha alteracoes locais. Atualizacao automatica pausada.')
    log('Use git stash ou clone limpo para atualizar.')
    log('')
    return { updated: false, reason: 'local-changes' }
  }

  const branch = readBranch(root, check.remoteManifest)
  log(`[1/4] Verificando GitHub (branch ${branch})...`)

  try {
    execSync('git fetch origin', { cwd: root, stdio: 'pipe' })
    const behind = execSync(`git rev-list HEAD..origin/${branch} --count`, {
      cwd: root,
      encoding: 'utf8',
    }).trim()

    if (behind === '0' && process.env.WA_UPDATE_FORCE !== '1') {
      log(`Versao ${readVersionJson(root)} — tudo certo.`)
      return { updated: false, version: readVersionJson(root) }
    }

    if (check.releaseNotes) {
      log(`Novidades: ${check.releaseNotes}`)
    }

    log(`[2/4] Baixando ${behind || '1'} commit(s)...`)
    execSync(`git pull --ff-only origin ${branch}`, { cwd: root, stdio: 'inherit' })

    const newVersion = readVersionJson(root)
    log(`[3/4] Codigo atualizado para ${newVersion}`)
    log('[4/4] Dependencias e banco serao atualizados pelo launcher...')

    return {
      updated: true,
      version: newVersion,
      method: 'git',
      commits: Number(behind || 1),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Git update failed: ${message}`)
    return { updated: false, reason: 'pull-failed', error: message, version: readVersionJson(root) }
  }
}

export function hasGitRepo(root) {
  return existsSync(join(root, '.git'))
}

export function hasGitCli() {
  return commandExists('git')
}
