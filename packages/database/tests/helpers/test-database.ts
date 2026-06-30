import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { createConfig, createProcessEnv } from '@finance-ai/shared/config'

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')

export type TestDatabase = {
  prisma: PrismaClient
  databaseUrl: string
  cleanup: () => Promise<void>
}

export function createIsolatedTestDatabase(): TestDatabase {
  const dir = mkdtempSync(join(tmpdir(), 'finance-ai-db-'))
  const dbPath = join(dir, 'test.db')
  const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`

  const env = createProcessEnv(
    createConfig(
      {
        NODE_ENV: 'test',
        DATABASE_URL: databaseUrl,
      },
      { overridesOnly: true },
    ),
  )

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: PACKAGE_ROOT,
    env,
    stdio: 'pipe',
  })

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  })

  return {
    prisma,
    databaseUrl,
    cleanup: async () => {
      await prisma.$disconnect()
      rmSync(dir, { recursive: true, force: true })
    },
  }
}

const RESET_ORDER = [
  'AppLog',
  'AssistantActionLog',
  'AssistantConversation',
  'AiProviderConfig',
  'ApiTokenUsage',
  'ConversationDailyReport',
  'Attachment',
  'Extraction',
  'ApprovalQueue',
  'Expense',
  'Revenue',
  'WhatsappMessage',
  'WhatsappChatConfig',
  'Category',
  'Supplier',
  'User',
  'AuditLog',
  'AppSettings',
] as const

/** Clears all tables between tests without re-running prisma db push. */
export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  )
  const existing = new Set(rows.map((row) => row.name))

  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF')
  try {
    for (const table of RESET_ORDER) {
      if (existing.has(table)) {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`)
      }
    }
  } finally {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  }
}
