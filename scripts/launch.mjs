#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOG_DIR = resolve(ROOT, 'logs')
const LOG_FILE = resolve(LOG_DIR, 'launcher.log')
const PORT = Number(process.env.PORT || 4000)

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`
  mkdirSync(LOG_DIR, { recursive: true })
  createWriteStream(LOG_FILE, { flags: 'a' }).write(line)
  console.log(message)
}

function run(command, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', ...opts })
    child.on('exit', (code) => {
      if (code === 0) resolvePromise(undefined)
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

function checkNode() {
  const version = process.versions.node
  const major = Number(version.split('.')[0])
  if (major < 20) {
    log(
      `Node ${version} detectado — requer Node 20+. ` +
        `No Windows, execute Start WhatsApp Assistant.bat para instalar automaticamente.`,
    )
    process.exit(1)
  }
  log(`Node ${version} (${process.execPath})`)
}

function needsInstall() {
  if (!existsSync(resolve(ROOT, 'node_modules'))) return true
  const pkgMtime = statSync(resolve(ROOT, 'package.json')).mtimeMs
  const lockMtime = existsSync(resolve(ROOT, 'pnpm-lock.yaml'))
    ? statSync(resolve(ROOT, 'pnpm-lock.yaml')).mtimeMs
    : 0
  const nmMtime = statSync(resolve(ROOT, 'node_modules')).mtimeMs
  return nmMtime < Math.max(pkgMtime, lockMtime)
}

async function waitForHealth(port, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`)
      if (res.ok) return true
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  return false
}

function openBrowser(url) {
  const platform = process.platform
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open'
  spawn(cmd, platform === 'win32' ? ['', url] : [url], { shell: true, detached: true, stdio: 'ignore' }).unref()
}

async function main() {
  log('Launcher iniciado')
  checkNode()

  try {
    execSync('corepack enable', { stdio: 'ignore', cwd: ROOT })
    execSync('corepack prepare pnpm@9.15.0 --activate', { stdio: 'inherit', cwd: ROOT })
  } catch {
    log('corepack não disponível — usando pnpm global se instalado')
  }

  if (needsInstall()) {
    log('Instalando dependências (pnpm install)…')
    await run('pnpm', ['install'])
  }

  log('Aplicando migrations…')
  await run('pnpm', ['db:migrate'])
  await run('pnpm', ['db:generate'])

  log(`Iniciando servidor na porta ${PORT}…`)
  const dev = spawn('pnpm', ['--filter', '@finance-ai/dashboard', 'dev'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: String(PORT) },
  })

  const ready = await waitForHealth(PORT)
  if (ready) {
    const url = `http://localhost:${PORT}`
    log(`Servidor pronto — abrindo ${url}`)
    openBrowser(url)
  } else {
    log('Timeout aguardando /api/health — verifique logs do servidor')
  }

  dev.on('exit', (code) => {
    log(`Servidor encerrado (code ${code ?? 0})`)
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  log(`Erro: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
