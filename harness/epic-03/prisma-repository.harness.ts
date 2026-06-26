import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const REPOS_DIR = join(ROOT, 'packages/database/src/repositories')

const REQUIRED_REPOSITORIES = [
  { file: 'expense.prisma-repository.ts', iface: 'ExpenseRepository' },
  { file: 'revenue.prisma-repository.ts', iface: 'RevenueRepository' },
  { file: 'category.prisma-repository.ts', iface: 'CategoryRepository' },
  { file: 'supplier.prisma-repository.ts', iface: 'SupplierRepository' },
  { file: 'user.prisma-repository.ts', iface: 'UserRepository' },
]

export const PrismaRepositoryHarness: Harness = {
  name: 'PrismaRepositoryHarness',
  async run() {
    const errors: string[] = []

    for (const { file, iface } of REQUIRED_REPOSITORIES) {
      const path = join(REPOS_DIR, file)
      if (!existsSync(path)) {
        errors.push(`Missing repository: ${file}`)
        continue
      }
      const content = readFileSync(path, 'utf-8')
      if (!content.includes(`implements ${iface}`)) {
        errors.push(`${file} must implement ${iface}`)
      }
      if (content.includes('@prisma/client') && content.includes('ValidationError')) {
        errors.push(`${file} must not contain business validation rules`)
      }
    }

    return createResult(this.name, errors)
  },
}
