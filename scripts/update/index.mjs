import { appendFileSync, createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { isUncPath } from '../resolve-app-root.mjs'
import { checkRemoteVersion } from './check-remote-version.mjs'
import { logUserFriendly, promptUpdate } from './prompt-update.mjs'
import { hasGitCli, hasGitRepo, updateViaGit } from './update-via-git.mjs'
import { updateViaZip } from './update-via-zip.mjs'
import { writeUpdateState } from './write-update-state.mjs'

function appendUpdateLog(root, line) {
  mkdirSync(join(root, 'logs'), { recursive: true })
  const logFile = join(root, 'logs', 'update.log')
  appendFileSync(logFile, `[${new Date().toISOString()}] ${line}\n`, 'utf-8')
}

export async function runAutoUpdate(root, options = {}) {
  const log = options.log ?? console.log

  if (options.skip || process.env.WA_SKIP_UPDATE === '1') {
    appendUpdateLog(root, 'skip env WA_SKIP_UPDATE')
    return { updated: false, reason: 'skipped' }
  }

  if (isUncPath(root)) {
    log('UNC path without drive mapping - skip auto-update')
    appendUpdateLog(root, 'skip unc-path')
    return { updated: false, reason: 'unc-path' }
  }

  log('Verificando atualizacoes...')
  appendUpdateLog(root, 'check started')

  const check = await checkRemoteVersion(root, { force: process.env.WA_UPDATE_FORCE === '1' })

  if (check.checkError) {
    log(`Sem conexao ou erro ao verificar: ${check.checkError}`)
    appendUpdateLog(root, `check error: ${check.checkError}`)
    return { updated: false, reason: 'offline', error: check.checkError, version: check.localVersion }
  }

  if (!check.updateAvailable && process.env.WA_UPDATE_FORCE !== '1') {
    logUserFriendly(`Voce ja esta na versao mais recente (${check.localVersion}).`)
    appendUpdateLog(root, `up to date ${check.localVersion}`)
    return { updated: false, version: check.localVersion }
  }

  const silent = options.silent || process.env.WA_UPDATE_SILENT === '1'
  const assumeYes = options.assumeYes || process.env.WA_UPDATE_AUTO === '1'

  if (!silent && !assumeYes && options.interactive !== false) {
    const answer = await promptUpdate(check, { defaultYes: true })
    if (answer === 'n') {
      appendUpdateLog(root, 'user declined update')
      return { updated: false, reason: 'user-declined', version: check.localVersion }
    }
  }

  let result
  if (hasGitRepo(root) && hasGitCli()) {
    appendUpdateLog(root, 'method git')
    result = await updateViaGit(root, check, log)
  } else {
    appendUpdateLog(root, 'method zip')
    result = await updateViaZip(root, check, log)
  }

  if (result.updated) {
    writeUpdateState(root, {
      version: result.version,
      method: result.method,
      updatedAt: new Date().toISOString(),
    })
    appendUpdateLog(root, `success ${result.method} -> ${result.version}`)
    log('')
    log('================================================')
    log(`  Programa atualizado para versao ${result.version}`)
    log('  Chats, WhatsApp e configuracoes preservados.')
    log('================================================')
    log('')
  } else {
    appendUpdateLog(root, `failed ${result.reason ?? 'unknown'} ${result.error ?? ''}`.trim())
  }

  return result
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { resolveAppRoot } = await import('../resolve-app-root.mjs')
  const root = resolveAppRoot(import.meta.url)
  runAutoUpdate(root, { interactive: process.stdout.isTTY }).then((result) => {
    process.exit(result.updated ? 0 : 0)
  })
}
