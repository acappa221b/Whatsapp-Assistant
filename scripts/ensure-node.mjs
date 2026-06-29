#!/usr/bin/env node
/**
 * Garante Node.js 20 LTS portátil em tools/node/ (Windows x64).
 * Exporta getLocalNodeExecutable() e ensureLocalNode().
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const NODE_TARGET_VERSION = '20.18.0'
export const NODE_MIN_MAJOR = 20

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TOOLS_DIR = join(ROOT, 'tools')
const NODE_DIR = join(TOOLS_DIR, 'node')
const LOG_DIR = join(ROOT, 'logs')
const LOG_FILE = join(LOG_DIR, 'launcher.log')

function log(message) {
  const line = `[${new Date().toISOString()}] [ensure-node] ${message}\n`
  mkdirSync(LOG_DIR, { recursive: true })
  createWriteStream(LOG_FILE, { flags: 'a' }).write(line)
}

function nodeZipName() {
  const { platform, arch } = process
  if (platform === 'win32' && arch === 'x64') {
    return `node-v${NODE_TARGET_VERSION}-win-x64.zip`
  }
  if (platform === 'darwin' && arch === 'x64') {
    return `node-v${NODE_TARGET_VERSION}-darwin-x64.tar.gz`
  }
  if (platform === 'darwin' && arch === 'arm64') {
    return `node-v${NODE_TARGET_VERSION}-darwin-arm64.tar.gz`
  }
  if (platform === 'linux' && arch === 'x64') {
    return `node-v${NODE_TARGET_VERSION}-linux-x64.tar.gz`
  }
  return null
}

/** Caminho do executável local, se o arquivo existir. */
export function getLocalNodeExecutable() {
  if (process.platform === 'win32') {
    return join(NODE_DIR, 'node.exe')
  }
  return join(NODE_DIR, 'bin', 'node')
}

function readNodeMajor(executable) {
  try {
    const out = execSync(`"${executable}" -p "process.versions.node"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return Number(out.split('.')[0])
  } catch {
    return 0
  }
}

function isSupportedPlatform() {
  return process.platform === 'win32' && process.arch === 'x64'
}

function unsupportedMessage() {
  if (process.platform === 'darwin' || process.platform === 'linux') {
    return (
      'Bootstrap automático do Node ainda não está disponível neste sistema.\n' +
      'Instale Node.js 20+ manualmente: https://nodejs.org\n' +
      'Depois execute: pnpm launch'
    )
  }
  return (
    `Bootstrap automático do Node não suporta ${process.platform}/${process.arch}.\n` +
    'Instale Node.js 20+ manualmente: https://nodejs.org'
  )
}

function downloadAndExtractWindows() {
  const zipName = nodeZipName()
  if (!zipName) {
    throw new Error(unsupportedMessage())
  }

  const url = `https://nodejs.org/dist/v${NODE_TARGET_VERSION}/${zipName}`
  const zipPath = join(TOOLS_DIR, zipName)
  const extractRoot = join(TOOLS_DIR, '_extract')

  mkdirSync(TOOLS_DIR, { recursive: true })
  if (existsSync(NODE_DIR)) {
    rmSync(NODE_DIR, { recursive: true, force: true })
  }
  if (existsSync(extractRoot)) {
    rmSync(extractRoot, { recursive: true, force: true })
  }

  log(`Baixando ${url}`)
  console.log(`Baixando Node.js ${NODE_TARGET_VERSION}…`)

  const ps = [
    '$ProgressPreference = "SilentlyContinue"',
    `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
    `Invoke-WebRequest -Uri '${url}' -OutFile '${zipPath.replace(/'/g, "''")}' -UseBasicParsing`,
    `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractRoot.replace(/'/g, "''")}' -Force`,
  ].join('; ')

  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, {
      stdio: 'inherit',
      cwd: ROOT,
    })
  } catch (error) {
    const hint =
      'Verifique sua conexão com a internet e tente novamente.\n' +
      'Se o problema persistir, instale Node.js 20+ em https://nodejs.org'
    log(`Falha no download: ${error instanceof Error ? error.message : String(error)}`)
    throw new Error(`Não foi possível baixar o Node.js.\n${hint}`)
  }

  const entries = readdirSync(extractRoot, { withFileTypes: true })
  const innerDir = entries.find((e) => e.isDirectory())
  if (!innerDir) {
    throw new Error('Pacote Node extraído em formato inesperado.')
  }

  const innerPath = join(extractRoot, innerDir.name)
  mkdirSync(NODE_DIR, { recursive: true })

  const copyPs = [
    `Copy-Item -Path '${innerPath.replace(/'/g, "''")}\\*' -Destination '${NODE_DIR.replace(/'/g, "''")}' -Recurse -Force`,
  ].join('; ')
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${copyPs}"`, {
    stdio: 'inherit',
  })

  try {
    rmSync(zipPath, { force: true })
    rmSync(extractRoot, { recursive: true, force: true })
  } catch {
    // cleanup best-effort
  }

  log(`Node instalado em ${NODE_DIR}`)
  console.log(`Node.js ${NODE_TARGET_VERSION} instalado em tools/node/`)
}

/**
 * Garante Node local >= 20. Baixa no Windows x64 se necessário.
 * @returns Caminho absoluto do executável
 */
export async function ensureLocalNode() {
  const executable = getLocalNodeExecutable()

  if (existsSync(executable)) {
    const major = readNodeMajor(executable)
    if (major >= NODE_MIN_MAJOR) {
      log(`Node local OK: ${executable} (v${major})`)
      return executable
    }
    log(`Node local desatualizado (${major}), reinstalando…`)
  }

  if (!isSupportedPlatform()) {
    throw new Error(unsupportedMessage())
  }

  downloadAndExtractWindows()

  if (!existsSync(executable)) {
    throw new Error('Node.js foi extraído, mas node.exe não foi encontrado em tools/node/')
  }

  const major = readNodeMajor(executable)
  if (major < NODE_MIN_MAJOR) {
    throw new Error(`Node instalado é v${major}; requer ${NODE_MIN_MAJOR}+.`)
  }

  return executable
}
