#!/usr/bin/env node
/**
 * Ensures portable Node.js 20 LTS in tools/node/ on Windows x64.
 * Exports getLocalNodeExecutable() and ensureLocalNode().
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

/** Returns the local executable path when present. */
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
      'Automatic Node bootstrap is not available on this system yet.\n' +
      'Install Node.js 20+ manually: https://nodejs.org\n' +
      'Then run: pnpm launch'
    )
  }
  return (
    `Automatic Node bootstrap does not support ${process.platform}/${process.arch}.\n` +
    'Install Node.js 20+ manually: https://nodejs.org'
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

  log(`Downloading ${url}`)
  console.log(`Downloading Node.js ${NODE_TARGET_VERSION}...`)

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
      'Check your internet connection and try again.\n' +
      'If the problem continues, install Node.js 20+ from https://nodejs.org'
    log(`Download failed: ${error instanceof Error ? error.message : String(error)}`)
    throw new Error(`Could not download Node.js.\n${hint}`)
  }

  const entries = readdirSync(extractRoot, { withFileTypes: true })
  const innerDir = entries.find((e) => e.isDirectory())
  if (!innerDir) {
    throw new Error('Unexpected extracted Node package format.')
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

  log(`Node installed in ${NODE_DIR}`)
  console.log(`Node.js ${NODE_TARGET_VERSION} installed in tools/node/`)
}

/**
 * Ensures local Node >= 20. Downloads on Windows x64 when needed.
 * @returns Absolute executable path
 */
export async function ensureLocalNode() {
  const executable = getLocalNodeExecutable()

  if (existsSync(executable)) {
    const major = readNodeMajor(executable)
    if (major >= NODE_MIN_MAJOR) {
      log(`Local Node OK: ${executable} (v${major})`)
      return executable
    }
    log(`Local Node is outdated (${major}), reinstalling...`)
  }

  if (!isSupportedPlatform()) {
    throw new Error(unsupportedMessage())
  }

  downloadAndExtractWindows()

  if (!existsSync(executable)) {
    throw new Error('Node.js was extracted, but node.exe was not found in tools/node/')
  }

  const major = readNodeMajor(executable)
  if (major < NODE_MIN_MAJOR) {
    throw new Error(`Installed Node is v${major}; requires ${NODE_MIN_MAJOR}+.`)
  }

  return executable
}
