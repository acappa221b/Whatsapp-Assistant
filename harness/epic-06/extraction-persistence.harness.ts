import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const PRISMA_SCHEMA = join(ROOT, 'packages/database/prisma/schema.prisma')
const REPOSITORY = join(ROOT, 'packages/database/src/repositories/extraction.prisma-repository.ts')
const API_ROUTE = join(ROOT, 'apps/dashboard/src/app/api/extractions/route.ts')

export const ExtractionPersistenceHarness: Harness = {
  name: 'ExtractionPersistenceHarness',
  async run() {
    const errors: string[] = []

    const schema = readFileSync(PRISMA_SCHEMA, 'utf-8')
    for (const keyword of ['model Extraction', 'type             ExtractionType', 'data             Json']) {
      if (!schema.includes(keyword)) {
        errors.push(`Prisma schema missing: ${keyword}`)
      }
    }

    if (!existsSync(REPOSITORY)) {
      errors.push('Missing ExtractionPrismaRepository')
    }

    if (!existsSync(API_ROUTE)) {
      errors.push('Missing GET /api/extractions route')
    }

    return createResult(this.name, errors)
  },
}
