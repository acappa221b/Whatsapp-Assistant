import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const SEED = join(ROOT, 'packages/database/prisma/seed.ts')

const REQUIRED_CATEGORIES = [
  'Alimentação',
  'Combustível',
  'Marketing',
  'Ferramentas',
  'Impostos',
  'Transporte',
  'Outros',
]

export const SeedHarness: Harness = {
  name: 'SeedHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(SEED)) {
      errors.push('Missing seed.ts')
      return createResult(this.name, errors)
    }

    const content = readFileSync(SEED, 'utf-8')

    if (!content.includes("type: 'EXPENSE'") && !content.includes('type: "EXPENSE"')) {
      errors.push('Seed must create EXPENSE categories')
    }

    for (const category of REQUIRED_CATEGORIES) {
      if (!content.includes(category)) {
        errors.push(`Seed missing category: ${category}`)
      }
    }

    return createResult(this.name, errors)
  },
}
