import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const SCHEMA_INDEX = join(ROOT, 'packages/ai/src/schemas/index.ts')
const EXTRACTION_SCHEMA = join(ROOT, 'packages/ai/src/schemas/extraction-result.schema.ts')

export const SchemaHarness: Harness = {
  name: 'SchemaHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(SCHEMA_INDEX)) {
      errors.push('Missing AI schemas index')
      return createResult(this.name, errors)
    }

    const schemaIndex = readFileSync(SCHEMA_INDEX, 'utf-8')
    for (const schemaName of ['ExpenseCandidateSchema', 'RevenueCandidateSchema', 'ExtractionResultSchema']) {
      if (!schemaIndex.includes(schemaName)) {
        errors.push(`Missing schema export: ${schemaName}`)
      }
    }

    const extractionSchema = readFileSync(EXTRACTION_SCHEMA, 'utf-8')
    const usesLegacyUnion = extractionSchema.includes('discriminatedUnion')
    const usesObjectRoot = extractionSchema.includes('.object({') || extractionSchema.includes('z.object({')
    if (!usesLegacyUnion && !usesObjectRoot) {
      errors.push('ExtractionResultSchema must define a structured root schema')
    }

    return createResult(this.name, errors)
  },
}
