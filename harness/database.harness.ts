import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from './types'
import { createResult } from './types'

const ROOT = join(import.meta.dirname, '..')
const SCHEMA = join(ROOT, 'packages/database/prisma/schema.prisma')

const REQUIRED_MODELS = [
  'Expense',
  'Attachment',
  'WhatsappMessage',
  'AuditLog',
  'User',
  'ApprovalQueue',
]

export const DatabaseHarness: Harness = {
  name: 'DatabaseHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(SCHEMA)) {
      errors.push('Missing Prisma schema')
      return createResult(this.name, errors)
    }

    const content = readFileSync(SCHEMA, 'utf-8')
    for (const model of REQUIRED_MODELS) {
      if (!content.includes(`model ${model}`)) {
        errors.push(`Missing Prisma model: ${model}`)
      }
    }

    if (!content.includes('provider = "sqlite"')) {
      errors.push('Expected SQLite provider in schema')
    }

    return createResult(this.name, errors)
  },
}
