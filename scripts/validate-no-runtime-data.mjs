#!/usr/bin/env node
import { execSync } from 'node:child_process'

function lsFiles(pattern = '') {
  try {
    const cmd = pattern ? `git ls-files ${pattern}` : 'git ls-files'
    return execSync(cmd, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

const errors = []

const trackedStorage = lsFiles('storage/').filter((path) => path !== 'storage/.gitkeep')
if (trackedStorage.length > 0) {
  errors.push(`Tracked storage/ paths (expected only storage/.gitkeep): ${trackedStorage.slice(0, 5).join(', ')}${trackedStorage.length > 5 ? ` (+${trackedStorage.length - 5} more)` : ''}`)
}

const trackedDb = lsFiles('*.db')
if (trackedDb.length > 0) {
  errors.push(`Tracked *.db files: ${trackedDb.join(', ')}`)
}

const trackedBackups = lsFiles('backups/')
if (trackedBackups.length > 0) {
  errors.push(`Tracked backups/: ${trackedBackups.join(', ')}`)
}

const trackedEnv = lsFiles().filter(
  (path) =>
    path === '.env' ||
    path.startsWith('.env.local') ||
    (path.startsWith('.env.') && !path.endsWith('.example') && path.includes('.local')),
)
if (trackedEnv.length > 0) {
  errors.push(`Tracked secret env files: ${trackedEnv.join(', ')}`)
}

const creds = lsFiles().filter((path) => path.endsWith('creds.json'))
if (creds.length > 0) {
  errors.push(`Tracked creds.json: ${creds.join(', ')}`)
}

if (errors.length > 0) {
  console.error('[validate:repo-hygiene] FAILED')
  for (const error of errors) {
    console.error(`  - ${error}`)
  }
  process.exit(1)
}

console.info('[validate:repo-hygiene] OK — no runtime data tracked in git')
