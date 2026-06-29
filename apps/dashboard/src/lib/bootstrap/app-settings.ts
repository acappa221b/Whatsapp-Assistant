import { randomBytes } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prisma } from '@finance-ai/database'
import { APP_DEFAULTS, REPO_ROOT } from '@finance-ai/shared/config'

let bootstrapDone = false
let cachedEncryptionSecret: string | null = null

async function ensureStorageDirs(): Promise<void> {
  const dirs = [
    APP_DEFAULTS.whatsappSessionPath,
    APP_DEFAULTS.mediaStoragePath,
    APP_DEFAULTS.tempStoragePath,
    APP_DEFAULTS.backupPath,
    'logs',
    'storage',
  ]
  for (const dir of dirs) {
    await mkdir(resolve(REPO_ROOT, dir), { recursive: true })
  }
}

export async function bootstrapAppSettings(): Promise<void> {
  if (bootstrapDone) return

  await ensureStorageDirs()

  let row = await prisma.appSettings.findUnique({ where: { id: 'default' } })
  if (!row) {
    const secret = randomBytes(32).toString('hex')
    row = await prisma.appSettings.create({
      data: {
        id: 'default',
        settingsEncryptionSecret: secret,
        encryptionSecretGenerated: true,
      },
    })
  } else if (!row.settingsEncryptionSecret) {
    const secret = randomBytes(32).toString('hex')
    row = await prisma.appSettings.update({
      where: { id: 'default' },
      data: {
        settingsEncryptionSecret: secret,
        encryptionSecretGenerated: true,
      },
    })
  }

  cachedEncryptionSecret = row.settingsEncryptionSecret
  bootstrapDone = true
}

export async function getSettingsEncryptionSecret(): Promise<string> {
  if (cachedEncryptionSecret) return cachedEncryptionSecret
  await bootstrapAppSettings()
  const row = await prisma.appSettings.findUnique({ where: { id: 'default' } })
  if (!row?.settingsEncryptionSecret) {
    throw new Error('Settings encryption secret not initialized')
  }
  cachedEncryptionSecret = row.settingsEncryptionSecret
  return cachedEncryptionSecret
}

export function resetBootstrapCache(): void {
  bootstrapDone = false
  cachedEncryptionSecret = null
}
