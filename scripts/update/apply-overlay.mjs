import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { canCopyUpdatePath } from './lib/protected-paths.mjs'

export function listFilesRecursive(dir, baseDir = dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full, baseDir))
    } else if (entry.isFile()) {
      files.push(relative(baseDir, full).replace(/\\/g, '/'))
    }
  }
  return files
}

export function applyOverlay(sourceRoot, targetRoot, log = console.log) {
  const files = listFilesRecursive(sourceRoot)
  let copied = 0
  let skipped = 0

  for (const rel of files) {
    if (!canCopyUpdatePath(rel)) {
      skipped += 1
      continue
    }
    const src = join(sourceRoot, rel)
    const dest = join(targetRoot, rel)
    mkdirSync(dirname(dest), { recursive: true })
    cpSync(src, dest, { force: true })
    copied += 1
  }

  log(`Overlay applied: ${copied} file(s) updated, ${skipped} protected path(s) skipped`)
  return { copied, skipped }
}

export function backupFilesForOverlay(sourceRoot, targetRoot, backupDir, log = console.log) {
  const files = listFilesRecursive(sourceRoot)
  let backedUp = 0
  mkdirSync(backupDir, { recursive: true })

  for (const rel of files) {
    if (!canCopyUpdatePath(rel)) continue
    const dest = join(targetRoot, rel)
    if (!existsSync(dest)) continue
    const backupPath = join(backupDir, rel)
    mkdirSync(dirname(backupPath), { recursive: true })
    cpSync(dest, backupPath, { force: true })
    backedUp += 1
  }

  log(`Backup created: ${backedUp} file(s) in ${backupDir}`)
  return backedUp
}

export function detectExtractRoot(extractDir) {
  const entries = readdirSync(extractDir, { withFileTypes: true })
  const dirs = entries.filter((entry) => entry.isDirectory())
  if (dirs.length === 1) {
    return join(extractDir, dirs[0].name)
  }
  return extractDir
}

export function folderSizeSummary(dir) {
  let count = 0
  for (const rel of listFilesRecursive(dir)) {
    if (statSync(join(dir, rel)).isFile()) count += 1
  }
  return count
}
