import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  countAppliedMigrations,
  getRuntimeDatabaseDiagnostics,
  listSqliteTables,
} from '@finance-ai/database'
import { applyConfigToProcessEnv, createConfigWithOverrides, REPO_ROOT } from '@finance-ai/shared/config'
import type { Harness } from '../types'
import { createResult } from '../types'

const EXPECTED_TABLES = [
  'User',
  'Category',
  'Supplier',
  'Expense',
  'Revenue',
  'WhatsappMessage',
  'Extraction',
]

function harnessConfig() {
  return createConfigWithOverrides({
    NODE_ENV: 'test',
    DATABASE_URL: 'file:./packages/database/prisma/dev.db',
    OPENAI_API_KEY: 'harness-placeholder',
    APP_VERSION: '1.0.5-rc07',
  })
}

export const RuntimeDatabaseHarness: Harness = {
  name: 'RuntimeDatabaseHarness',
  async run() {
    const errors: string[] = []
    const resolved = harnessConfig()
    applyConfigToProcessEnv(resolved)
    const diagnostics = getRuntimeDatabaseDiagnostics(resolved.database.url)

    if (!diagnostics.absolutePath.replace(/\\/g, '/').includes('packages/database/prisma/dev.db')) {
      errors.push(`Unexpected resolved database path: ${diagnostics.absolutePath}`)
    }

    if (!diagnostics.exists) {
      errors.push(`Canonical SQLite file missing: ${diagnostics.absolutePath}`)
      return createResult(this.name, errors)
    }

    if (diagnostics.sizeBytes <= 0) {
      errors.push('Canonical SQLite file has zero size')
    }

    const orphanPath = join(
      REPO_ROOT,
      'packages/database/prisma/packages/database/prisma/dev.db',
    )
    if (existsSync(orphanPath)) {
      errors.push(`Orphan SQLite database still present: ${orphanPath}`)
    }

    try {
      const tables = await listSqliteTables()
      for (const table of EXPECTED_TABLES) {
        if (!tables.includes(table)) {
          errors.push(`Missing table in canonical database: ${table}`)
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }

    return createResult(this.name, errors)
  },
}

export const MigrationConsistencyHarness: Harness = {
  name: 'MigrationConsistencyHarness',
  async run() {
    const errors: string[] = []
    const migrationsDir = join(REPO_ROOT, 'packages/database/prisma/migrations')
    const migrationFolders = readdirSync(migrationsDir).filter((entry) => entry !== 'migration_lock.toml')

    if (migrationFolders.length < 4) {
      errors.push('Expected at least 4 migration folders')
    }

    applyConfigToProcessEnv(harnessConfig())
    const applied = await countAppliedMigrations()
    if (applied < migrationFolders.length) {
      errors.push(`Applied migrations (${applied}) are fewer than migration folders (${migrationFolders.length})`)
    }

    for (const folder of migrationFolders) {
      const sqlPath = join(migrationsDir, folder, 'migration.sql')
      if (!existsSync(sqlPath)) {
        errors.push(`Missing migration.sql in ${folder}`)
      }
    }

    const lockPath = join(migrationsDir, 'migration_lock.toml')
    if (!existsSync(lockPath)) {
      errors.push('Missing migration_lock.toml')
    } else {
      const lock = readFileSync(lockPath, 'utf-8')
      if (!lock.includes('sqlite')) {
        errors.push('migration_lock.toml does not reference sqlite provider')
      }
    }

    return createResult(this.name, errors)
  },
}

export const HealthEndpointHarness: Harness = {
  name: 'HealthEndpointHarness',
  async run() {
    const errors: string[] = []
    applyConfigToProcessEnv(harnessConfig())

    const { GET } = await import('../../apps/dashboard/src/app/api/health/route')
    const response = await GET()
    const body = await response.json()

    if (body.version !== '1.0.5-rc07') {
      errors.push(`Health version mismatch: ${body.version}`)
    }

    if (body.status !== 'ok') {
      errors.push(`Health status expected ok, received ${body.status}`)
    }

    const { GET: getDatabaseHealth } = await import('../../apps/dashboard/src/app/api/health/database/route')
    const dbResponse = await getDatabaseHealth()
    if (dbResponse.status !== 200) {
      errors.push(`Database health endpoint returned ${dbResponse.status}`)
    }

    return createResult(this.name, errors)
  },
}

export const WhatsappConnectHarness: Harness = {
  name: 'WhatsappConnectHarness',
  async run() {
    const errors: string[] = []
    const { BaileysWhatsappProvider } = await import('../../packages/whatsapp/src/index.ts')

    const provider = new BaileysWhatsappProvider({
      authDir: join(REPO_ROOT, 'storage/whatsapp-harness'),
      socketFactory: async (options) => {
        setTimeout(() => options.onQr('harness-qr-token'), 10)
        return {
          ev: {
            on: () => undefined,
            removeAllListeners: () => undefined,
          },
          end: () => undefined,
        }
      },
      qrDataUrlGenerator: async () => 'data:image/png;base64,harness',
    })

    await provider.connect()
    await new Promise((resolve) => setTimeout(resolve, 20))
    const status = provider.getStatus()
    if (status.status !== 'qr' && status.status !== 'connecting') {
      errors.push(`Expected qr/connecting status after connect, received ${status.status}`)
    }
    if (!status.qrCodeDataUrl) {
      errors.push('Expected QR data URL after mocked connect')
    }

    await provider.disconnect()
    return createResult(this.name, errors)
  },
}

export const ApiErrorHandlingHarness: Harness = {
  name: 'ApiErrorHandlingHarness',
  async run() {
    const errors: string[] = []
    const { mapRepositoryError } = await import('../../apps/dashboard/src/lib/api-error.ts')

    const previewLike404 = mapRepositoryError({ code: 'P2025' })
    if (!previewLike404 || previewLike404.status !== 404) {
      errors.push('Expected P2025 repository errors to map to 404')
    }

    const schemaLike404 = mapRepositoryError({ code: 'P2022' })
    if (!schemaLike404 || schemaLike404.status !== 404) {
      errors.push('Expected P2022 repository errors to map to 404')
    }

    const unknown = mapRepositoryError(new Error('unexpected'))
    if (unknown !== null) {
      errors.push('Expected unknown repository errors to remain unmapped')
    }

    return createResult(this.name, errors)
  },
}
