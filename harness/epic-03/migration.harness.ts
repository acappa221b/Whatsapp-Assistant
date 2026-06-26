import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const MIGRATIONS_DIR = join(ROOT, 'packages/database/prisma/migrations')
const MIGRATION_NAME = '0001_initial_financial_domain'

export const MigrationHarness: Harness = {
  name: 'MigrationHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(MIGRATIONS_DIR)) {
      errors.push('Missing migrations directory')
      return createResult(this.name, errors)
    }

    const migrationDir = readdirSync(MIGRATIONS_DIR).find((entry) => entry.includes(MIGRATION_NAME))
    if (!migrationDir) {
      errors.push(`Missing migration: ${MIGRATION_NAME}`)
      return createResult(this.name, errors)
    }

    const sqlPath = join(MIGRATIONS_DIR, migrationDir, 'migration.sql')
    if (!existsSync(sqlPath)) {
      errors.push(`Missing migration.sql in ${migrationDir}`)
    }

    return createResult(this.name, errors)
  },
}
