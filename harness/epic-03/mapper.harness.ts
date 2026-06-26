import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const MAPPERS_DIR = join(ROOT, 'packages/database/src/mappers')

const REQUIRED_MAPPERS = [
  'expense.mapper.ts',
  'revenue.mapper.ts',
  'category.mapper.ts',
  'supplier.mapper.ts',
  'user.mapper.ts',
]

export const MapperHarness: Harness = {
  name: 'MapperHarness',
  async run() {
    const errors: string[] = []

    for (const file of REQUIRED_MAPPERS) {
      const path = join(MAPPERS_DIR, file)
      if (!existsSync(path)) {
        errors.push(`Missing mapper: ${file}`)
        continue
      }
      const content = readFileSync(path, 'utf-8')
      if (!content.includes('toDomain')) {
        errors.push(`${file} missing toDomain()`)
      }
      if (!content.includes('toPersistence')) {
        errors.push(`${file} missing toPersistence()`)
      }
    }

    return createResult(this.name, errors)
  },
}
