import { InMemoryEventBus } from '@finance-ai/core/events'
import {
  CreateCategoryUseCase,
  GetCategoryByIdUseCase,
  ListCategoriesUseCase,
  UpdateCategoryUseCase,
} from '@finance-ai/core/domains/category'
import { CategoryPrismaRepository } from '@finance-ai/database'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database.ts'

describe('CategoryPrismaRepository integration', () => {
  let db: TestDatabase
  let repository: CategoryPrismaRepository
  const eventBus = new InMemoryEventBus()

  beforeAll(() => {
    db = createIsolatedTestDatabase()
    repository = new CategoryPrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  it('Create', async () => {
    const created = await new CreateCategoryUseCase(repository, eventBus).execute({
      name: 'Marketing',
      type: 'EXPENSE',
    })
    expect(created.name).toBe('Marketing')
    expect(created.type).toBe('EXPENSE')
  })

  it('Update', async () => {
    const created = await new CreateCategoryUseCase(repository, eventBus).execute({
      name: 'Tools',
      type: 'EXPENSE',
    })
    const updated = await new UpdateCategoryUseCase(repository, eventBus).execute({
      id: created.id,
      name: 'Ferramentas',
    })
    expect(updated.name).toBe('Ferramentas')
  })

  it('GetById', async () => {
    const created = await new CreateCategoryUseCase(repository, eventBus).execute({
      name: 'Transport',
      type: 'EXPENSE',
    })
    const found = await new GetCategoryByIdUseCase(repository).execute(created.id)
    expect(found.id).toBe(created.id)
  })

  it('List', async () => {
    await new CreateCategoryUseCase(repository, eventBus).execute({ name: 'Cat A', type: 'EXPENSE' })
    await new CreateCategoryUseCase(repository, eventBus).execute({ name: 'Cat B', type: 'REVENUE' })
    const expenseCategories = await new ListCategoriesUseCase(repository).execute('EXPENSE')
    expect(expenseCategories).toHaveLength(1)
    expect(expenseCategories[0]?.type).toBe('EXPENSE')
  })
})
