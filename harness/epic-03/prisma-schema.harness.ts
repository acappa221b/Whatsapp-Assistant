import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const SCHEMA = join(ROOT, 'packages/database/prisma/schema.prisma')

const REQUIRED_MODELS = ['Expense', 'Revenue', 'Category', 'Supplier', 'User']
const REQUIRED_ENUMS = ['ExpenseSource', 'CategoryType', 'UserRole']

export const PrismaSchemaHarness: Harness = {
  name: 'PrismaSchemaHarness',
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

    for (const enumName of REQUIRED_ENUMS) {
      if (!content.includes(`enum ${enumName}`)) {
        errors.push(`Missing Prisma enum: ${enumName}`)
      }
    }

    const requiredIndexes = [
      '@@index([categoryId])',
      '@@index([supplierId])',
      '@@index([date])',
      '@@index([deletedAt])',
      '@@unique([name, type])',
    ]

    for (const index of requiredIndexes) {
      if (!content.includes(index)) {
        errors.push(`Missing schema constraint/index: ${index}`)
      }
    }

    if (!content.includes('provider = "sqlite"')) {
      errors.push('Expected SQLite provider in schema')
    }

    return createResult(this.name, errors)
  },
}
