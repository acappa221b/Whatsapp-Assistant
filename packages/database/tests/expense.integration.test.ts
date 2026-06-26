import { InMemoryEventBus } from '@finance-ai/core/events'
import {
  CreateExpenseUseCase,
  GetExpenseByIdUseCase,
  ListExpensesUseCase,
  SoftDeleteExpenseUseCase,
  UpdateExpenseUseCase,
} from '@finance-ai/core/domains/expense'
import { CreateCategoryUseCase } from '@finance-ai/core/domains/category'
import { CreateSupplierUseCase } from '@finance-ai/core/domains/supplier'
import {
  CategoryPrismaRepository,
  ExpensePrismaRepository,
  SupplierPrismaRepository,
} from '@finance-ai/database'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database.ts'

describe('ExpensePrismaRepository integration', () => {
  let db: TestDatabase
  let expenseRepository: ExpensePrismaRepository
  let categoryRepository: CategoryPrismaRepository
  let supplierRepository: SupplierPrismaRepository
  const eventBus = new InMemoryEventBus()

  beforeAll(() => {
    db = createIsolatedTestDatabase()
    expenseRepository = new ExpensePrismaRepository(db.prisma)
    categoryRepository = new CategoryPrismaRepository(db.prisma)
    supplierRepository = new SupplierPrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  async function seedCategory() {
    return new CreateCategoryUseCase(categoryRepository, eventBus).execute({
      name: 'Alimentação',
      type: 'EXPENSE',
    })
  }

  it('Create', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(
      expenseRepository,
      categoryRepository,
      supplierRepository,
      eventBus,
    ).execute({
      description: 'Almoço',
      amount: 45.5,
      categoryId: category.id,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    expect(created.amount).toBe(45.5)
    expect(created.categoryId).toBe(category.id)
  })

  it('Update', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(
      expenseRepository,
      categoryRepository,
      supplierRepository,
      eventBus,
    ).execute({
      description: 'Almoço',
      amount: 45.5,
      categoryId: category.id,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    const updated = await new UpdateExpenseUseCase(
      expenseRepository,
      categoryRepository,
      eventBus,
    ).execute({
      id: created.id,
      description: 'Jantar',
      amount: 60,
    })
    expect(updated.description).toBe('Jantar')
    expect(updated.amount).toBe(60)
  })

  it('GetById', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(
      expenseRepository,
      categoryRepository,
      supplierRepository,
      eventBus,
    ).execute({
      description: 'Almoço',
      amount: 45.5,
      categoryId: category.id,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    const found = await new GetExpenseByIdUseCase(expenseRepository).execute(created.id)
    expect(found.id).toBe(created.id)
  })

  it('List', async () => {
    const category = await seedCategory()
    await new CreateExpenseUseCase(
      expenseRepository,
      categoryRepository,
      supplierRepository,
      eventBus,
    ).execute({
      description: 'A',
      amount: 10,
      categoryId: category.id,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    await new CreateExpenseUseCase(
      expenseRepository,
      categoryRepository,
      supplierRepository,
      eventBus,
    ).execute({
      description: 'B',
      amount: 20,
      categoryId: category.id,
      date: new Date('2025-01-16'),
      source: 'MANUAL',
    })
    const result = await new ListExpensesUseCase(expenseRepository).execute({}, { page: 1, limit: 10 })
    expect(result.total).toBe(2)
    expect(result.items).toHaveLength(2)
  })

  it('SoftDelete', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(
      expenseRepository,
      categoryRepository,
      supplierRepository,
      eventBus,
    ).execute({
      description: 'Almoço',
      amount: 45.5,
      categoryId: category.id,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    const deleted = await new SoftDeleteExpenseUseCase(expenseRepository, eventBus).execute(created.id)
    expect(deleted.deletedAt).not.toBeNull()
    const list = await new ListExpensesUseCase(expenseRepository).execute({}, { page: 1, limit: 10 })
    expect(list.total).toBe(0)
  })
})
