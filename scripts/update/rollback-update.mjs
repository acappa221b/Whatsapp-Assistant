import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

function restoreDir(backupDir, targetRoot) {
  if (!existsSync(backupDir)) return 0
  let restored = 0
  const walk = (current, relBase = '') => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name
      const src = join(current, entry.name)
      if (entry.isDirectory()) {
        walk(src, rel)
      } else {
        const dest = join(targetRoot, rel)
        mkdirSync(dirname(dest), { recursive: true })
        cpSync(src, dest, { force: true })
        restored += 1
      }
    }
  }
  walk(backupDir)
  return restored
}

export function rollbackUpdate(root, backupDir, log = console.log) {
  if (!existsSync(backupDir)) {
    log('Rollback skipped: no backup directory')
    return { restored: 0 }
  }
  const restored = restoreDir(backupDir, root)
  log(`Rollback complete: ${restored} file(s) restored`)
  return { restored }
}

export function cleanupRollbackBackup(root) {
  const backupRoot = join(root, '.update-backup')
  if (existsSync(backupRoot)) {
    rmSync(backupRoot, { recursive: true, force: true })
  }
}

export function createBackupDir(root) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = join(root, '.update-backup', timestamp)
  mkdirSync(backupDir, { recursive: true })
  return backupDir
}
