import { mkdirSync } from 'node:fs'
import type { PrismaClient } from '@prisma/client'
import type { ResolvedConfig } from '@finance-ai/shared/config'
import { logOpenAIApiKeyPresence } from '@finance-ai/shared/config'
import { getRuntimeDatabaseDiagnostics } from './runtime-diagnostics'
import { prisma as defaultPrisma } from './client'

const REQUIRED_TABLES = [
  'User',
  'Category',
  'Supplier',
  'Expense',
  'Revenue',
  'WhatsappMessage',
  'WhatsappChatConfig',
  'Extraction',
] as const

export type StartupValidationResult = {
  database: ReturnType<typeof getRuntimeDatabaseDiagnostics>
  tables: string[]
  missingTables: string[]
  migrationsApplied: number
}

export class StartupValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StartupValidationError'
  }
}

export async function listSqliteTables(client: PrismaClient = defaultPrisma): Promise<string[]> {
  const rows = await client.$queryRawUnsafe<Array<{ name: string }>>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  )
  return rows.map((row) => row.name)
}

export async function countAppliedMigrations(client: PrismaClient = defaultPrisma): Promise<number> {
  try {
    const rows = await client.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM _prisma_migrations`,
    )
    return Number(rows[0]?.count ?? 0)
  } catch {
    return 0
  }
}

export function ensureStorageDirectories(config: ResolvedConfig): void {
  const directories = [
    config.storage.mediaPath,
    config.storage.tempPath,
    config.storage.backupPath,
    config.whatsapp.sessionPath,
  ]

  for (const directory of directories) {
    mkdirSync(directory, { recursive: true })
  }
}

export async function validateRuntimeStartup(
  config: ResolvedConfig,
  client: PrismaClient = defaultPrisma,
): Promise<StartupValidationResult> {
  logOpenAIApiKeyPresence(config.openai.apiKey)

  const database = getRuntimeDatabaseDiagnostics(config.database.url)

  if (!database.exists) {
    throw new StartupValidationError(
      `SQLite database file not found at ${database.absolutePath}. Run pnpm db:migrate to create and migrate the database.`,
    )
  }

  ensureStorageDirectories(config)

  try {
    await client.$queryRaw`SELECT 1`
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new StartupValidationError(`Database connection failed: ${message}`)
  }

  const tables = await listSqliteTables(client)
  const missingTables = REQUIRED_TABLES.filter((table) => !tables.includes(table))
  if (missingTables.length > 0) {
    throw new StartupValidationError(
      `Database schema is incompatible. Missing tables: ${missingTables.join(', ')}. Run pnpm db:migrate.`,
    )
  }

  const migrationsApplied = await countAppliedMigrations(client)
  if (config.app.nodeEnv !== 'test' && migrationsApplied === 0) {
    throw new StartupValidationError(
      'No Prisma migrations recorded. Run pnpm db:migrate before starting the application.',
    )
  }

  return {
    database,
    tables,
    missingTables,
    migrationsApplied,
  }
}
