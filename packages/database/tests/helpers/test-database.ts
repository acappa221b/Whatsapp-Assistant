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

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: PACKAGE_ROOT,
    env: createProcessEnv(
      createConfig({
        NODE_ENV: 'test',
        DATABASE_URL: databaseUrl,
        OPENAI_API_KEY: 'test-openai-key',
      }),
    ),
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

/** Clears all tables between tests without re-running prisma db push. */
export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.attachment.deleteMany(),
    prisma.extraction.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.approvalQueue.deleteMany(),
    prisma.revenue.deleteMany(),
    prisma.category.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.user.deleteMany(),
    prisma.whatsappMessage.deleteMany(),
    prisma.auditLog.deleteMany(),
  ])
}
