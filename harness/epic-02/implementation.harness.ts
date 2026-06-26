import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const DOMAINS = join(ROOT, 'packages/core/src/domains')

type EntityConfig = {
  name: string
  folder: string
  entityFile: string
  repositoryFile: string
  inMemoryFile: string
  useCaseFile: string
  useCases: string[]
  events: string[]
  testFolder: string
}

const ENTITIES: EntityConfig[] = [
  {
    name: 'ExpenseImplementationHarness',
    folder: 'expense',
    entityFile: 'domain/expense.entity.ts',
    repositoryFile: 'domain/expense.repository.ts',
    inMemoryFile: 'infrastructure/in-memory-expense.repository.ts',
    useCaseFile: 'application/expense.use-cases.ts',
    useCases: ['CreateExpense', 'UpdateExpense', 'SoftDeleteExpense', 'GetExpenseById', 'ListExpenses'],
    events: ['ExpenseCreated', 'ExpenseUpdated', 'ExpenseSoftDeleted'],
    testFolder: 'tests',
  },
  {
    name: 'RevenueImplementationHarness',
    folder: 'revenue',
    entityFile: 'domain/revenue.entity.ts',
    repositoryFile: 'domain/revenue.repository.ts',
    inMemoryFile: 'infrastructure/in-memory-revenue.repository.ts',
    useCaseFile: 'application/revenue.use-cases.ts',
    useCases: ['CreateRevenue', 'UpdateRevenue', 'SoftDeleteRevenue', 'GetRevenueById', 'ListRevenues'],
    events: ['RevenueCreated', 'RevenueUpdated', 'RevenueSoftDeleted'],
    testFolder: 'tests',
  },
  {
    name: 'CategoryImplementationHarness',
    folder: 'category',
    entityFile: 'domain/category.entity.ts',
    repositoryFile: 'domain/category.repository.ts',
    inMemoryFile: 'infrastructure/in-memory-category.repository.ts',
    useCaseFile: 'application/category.use-cases.ts',
    useCases: ['CreateCategory', 'UpdateCategory', 'GetCategoryById', 'ListCategories'],
    events: ['CategoryCreated', 'CategoryUpdated'],
    testFolder: 'tests',
  },
  {
    name: 'SupplierImplementationHarness',
    folder: 'supplier',
    entityFile: 'domain/supplier.entity.ts',
    repositoryFile: 'domain/supplier.repository.ts',
    inMemoryFile: 'infrastructure/in-memory-supplier.repository.ts',
    useCaseFile: 'application/supplier.use-cases.ts',
    useCases: ['CreateSupplier', 'UpdateSupplier', 'SoftDeleteSupplier', 'GetSupplierById', 'ListSuppliers'],
    events: ['SupplierCreated', 'SupplierUpdated'],
    testFolder: 'tests',
  },
  {
    name: 'UserImplementationHarness',
    folder: 'user',
    entityFile: 'domain/user.entity.ts',
    repositoryFile: 'domain/user.repository.ts',
    inMemoryFile: 'infrastructure/in-memory-user.repository.ts',
    useCaseFile: 'application/user.use-cases.ts',
    useCases: ['CreateUser', 'UpdateUser', 'GetUserById', 'ListUsers'],
    events: ['UserCreated', 'UserUpdated'],
    testFolder: 'tests',
  },
]

function validateEntity(config: EntityConfig): string[] {
  const errors: string[] = []
  const base = join(DOMAINS, config.folder)
  const requiredFiles = [
    config.entityFile,
    config.repositoryFile,
    config.inMemoryFile,
    config.useCaseFile,
  ]
  for (const file of requiredFiles) {
    if (!existsSync(join(base, file))) {
      errors.push(`${config.folder}: missing ${file}`)
    }
  }
  const testDir = join(base, config.testFolder)
  if (!existsSync(testDir) || readdirSync(testDir).filter((f) => f.endsWith('.test.ts')).length === 0) {
    errors.push(`${config.folder}: missing tests/*.test.ts`)
  }
  const useCasePath = join(base, config.useCaseFile)
  if (existsSync(useCasePath)) {
    const content = readFileSync(useCasePath, 'utf-8')
    for (const uc of config.useCases) {
      if (!content.includes(uc)) errors.push(`${config.folder}: missing use case ${uc}`)
    }
    for (const ev of config.events) {
      if (!content.includes(ev)) errors.push(`${config.folder}: missing event ${ev}`)
    }
  }
  const eventsFile = join(ROOT, 'packages/core/src/events/index.ts')
  const eventsContent = readFileSync(eventsFile, 'utf-8')
  for (const ev of config.events) {
    if (!eventsContent.includes(ev)) errors.push(`events: missing ${ev}`)
  }
  return errors
}

function createImplementationHarness(config: EntityConfig): Harness {
  return {
    name: config.name,
    async run() {
      return createResult(config.name, validateEntity(config))
    },
  }
}

export const ExpenseImplementationHarness = createImplementationHarness(ENTITIES[0]!)
export const RevenueImplementationHarness = createImplementationHarness(ENTITIES[1]!)
export const CategoryImplementationHarness = createImplementationHarness(ENTITIES[2]!)
export const SupplierImplementationHarness = createImplementationHarness(ENTITIES[3]!)
export const UserImplementationHarness = createImplementationHarness(ENTITIES[4]!)
