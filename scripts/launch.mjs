#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOG_DIR = resolve(ROOT, 'logs')
const LOG_FILE = resolve(LOG_DIR, 'launcher.log')
const PORT = Number(process.env.PORT || 4000)
const NODE_BIN_DIR = dirname(process.execPath)
const COREPACK_EXE = resolve(
  NODE_BIN_DIR,
  process.platform === 'win32' ? 'corepack.cmd' : 'corepack',
)
const PNPM_EXE = resolve(
  NODE_BIN_DIR,
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
)

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

function createLauncherEnv(extraEnv = {}) {
  const pathKey = process.platform === 'win32' ? 'Path' : 'PATH'
  const currentPath = process.env[pathKey] ?? process.env.PATH ?? ''
  return {
    ...process.env,
    ...extraEnv,
    [pathKey]: `${NODE_BIN_DIR}${process.platform === 'win32' ? ';' : ':'}${currentPath}`,
  }
}

function getPnpmCommand(args = []) {
  if (existsSync(PNPM_EXE)) {
    return {
      command: PNPM_EXE,
      args,
      env: createLauncherEnv(),
    }
  }

  if (existsSync(COREPACK_EXE)) {
    return {
      command: COREPACK_EXE,
      args: ['pnpm', ...args],
      env: createLauncherEnv(),
    }
  }

  return {
    command: 'pnpm',
    args,
    env: createLauncherEnv(),
  }
}

function ensureLocalPnpmShim() {
  if (!existsSync(COREPACK_EXE)) return

  if (process.platform === 'win32') {
    if (!existsSync(PNPM_EXE)) {
      writeFileSync(PNPM_EXE, '@echo off\r\n"%~dp0corepack.cmd" pnpm %*\r\n', 'ascii')
    }
    return
  }

  if (!existsSync(PNPM_EXE)) {
    writeFileSync(PNPM_EXE, '#!/bin/sh\n"$(dirname "$0")/corepack" pnpm "$@"\n', 'ascii')
  }
}

async function runPnpm(args) {
  const pnpm = getPnpmCommand(args)
  await run(pnpm.command, pnpm.args, { env: pnpm.env })
}

function checkNode() {
  const version = process.versions.node
  const major = Number(version.split('.')[0])
  if (major < 20) {
    log(
      `Node ${version} detected - requires Node 20+. ` +
        `On Windows, run Start WhatsApp Assistant.bat to install it automatically.`,
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
    if (existsSync(COREPACK_EXE)) {
      execSync(`"${COREPACK_EXE}" prepare pnpm@9.15.0 --activate`, {
        stdio: 'inherit',
        cwd: ROOT,
        env: createLauncherEnv(),
      })
    } else {
      execSync('corepack enable', { stdio: 'ignore', cwd: ROOT, env: createLauncherEnv() })
      execSync('corepack prepare pnpm@9.15.0 --activate', {
        stdio: 'inherit',
        cwd: ROOT,
        env: createLauncherEnv(),
      })
    }
  } catch {
    log('corepack not available - using global pnpm if installed')
  }

  ensureLocalPnpmShim()

  if (needsInstall()) {
    log('Installing dependencies (pnpm install)...')
    await runPnpm(['install'])
  }

  log('Applying migrations...')
  await runPnpm(['db:migrate'])
  await runPnpm(['db:generate'])

  log(`Starting server on port ${PORT}...`)
  const pnpm = getPnpmCommand(['--filter', '@finance-ai/dashboard', 'dev'])
  const dev = spawn(pnpm.command, pnpm.args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: createLauncherEnv({ PORT: String(PORT) }),
  })

  const ready = await waitForHealth(PORT)
  if (ready) {
    const url = `http://localhost:${PORT}`
    log(`Server ready - opening ${url}`)
    openBrowser(url)
  } else {
    log('Timed out waiting for /api/health - check server logs')
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
