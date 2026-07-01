import { existsSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { resolveAppRoot } from './resolve-app-root.mjs'

const ROOT = resolveAppRoot(import.meta.url)
const SCHEMA_PATH = resolve(ROOT, 'packages/database/prisma/schema.prisma')
const MIGRATIONS_DIR = resolve(ROOT, 'packages/database/prisma/migrations')
const GENERATED_CLIENT_INDEX = resolve(ROOT, 'node_modules/.prisma/client/index.js')
const databaseRequire = createRequire(resolve(ROOT, 'packages/database/package.json'))

export function getPrismaEnginePath() {
  try {
    return databaseRequire.resolve('.prisma/client/index')
  } catch {
    // pnpm: generated client is a sibling of @prisma/client inside the virtual store
    try {
      const clientEntry = databaseRequire.resolve('@prisma/client')
      const pnpmClientIndex = resolve(
        dirname(clientEntry),
        '..',
        '..',
        '.prisma',
        'client',
        'index.js',
      )
      if (existsSync(pnpmClientIndex)) {
        return pnpmClientIndex
      }
    } catch {
      // ignore
    }
    if (existsSync(GENERATED_CLIENT_INDEX)) {
      return GENERATED_CLIENT_INDEX
    }
    return null
  }
}

/** True only when prisma generate has produced .prisma/client (not just @prisma/client npm package). */
export function isGeneratedPrismaClientReady() {
  const enginePath = getPrismaEnginePath()
  return Boolean(enginePath && existsSync(enginePath))
}

export function prismaClientExists() {
  return isGeneratedPrismaClientReady()
}

export function needsPrismaGenerate() {
  if (!isGeneratedPrismaClientReady()) return true
  if (!existsSync(SCHEMA_PATH)) return false

  const enginePath = getPrismaEnginePath()
  if (!enginePath || !existsSync(enginePath)) return true

  const clientMtime = statSync(enginePath).mtimeMs
  if (statSync(SCHEMA_PATH).mtimeMs > clientMtime) return true

  if (!existsSync(MIGRATIONS_DIR)) return false
  for (const name of readdirSync(MIGRATIONS_DIR)) {
    const sqlPath = resolve(MIGRATIONS_DIR, name, 'migration.sql')
    if (existsSync(sqlPath) && statSync(sqlPath).mtimeMs > clientMtime) {
      return true
    }
  }
  return false
}

export function isPrismaEpermError(message) {
  return /EPERM|operation not permitted/i.test(message)
}

/** Stop a previous dashboard dev server so Prisma engine DLL can be replaced on Windows. */
export async function stopStaleDevServer(port, log = console.log) {
  const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms))

  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
      const pids = new Set()
      for (const line of output.split('\n')) {
        if (!line.includes('LISTENING')) continue
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && /^\d+$/.test(pid) && pid !== String(process.pid)) {
          pids.add(pid)
        }
      }
      for (const pid of pids) {
        log(`Encerrando servidor anterior na porta ${port} (PID ${pid})...`)
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        } catch {
          // process may have already exited
        }
      }
      if (pids.size > 0) {
        await sleep(1500)
      }
      return pids.size
    } catch {
      return 0
    }
  }

  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' })
    const pids = output
      .split('\n')
      .map((line) => line.trim())
      .filter((pid) => pid && pid !== String(process.pid))
    for (const pid of pids) {
      log(`Encerrando servidor anterior na porta ${port} (PID ${pid})...`)
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
      } catch {
        // ignore
      }
    }
    if (pids.length > 0) {
      await sleep(1500)
    }
    return pids.length
  } catch {
    return 0
  }
}

export async function runDbGenerateSafe(runPnpm, log = console.log) {
  const attempts = 2
  let lastError = ''

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runPnpm(['db:generate'])
      return { ok: true }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      if (attempt < attempts) {
        log('db:generate falhou — tentando novamente em 2s...')
        await stopStaleDevServer(Number(process.env.PORT || 4000), log)
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
    }
  }

  if (isGeneratedPrismaClientReady()) {
    log('')
    log('AVISO: db:generate falhou, mas engine gerado anteriormente existe. Continuando...')
    log('Se houver erro de banco, feche outros terminais Node e rode o .bat novamente.')
    log('')
    return { ok: false, skipped: true, reason: isPrismaEpermError(lastError) ? 'eperm' : 'generate-failed' }
  }

  throw new Error(lastError || 'db:generate failed')
}
