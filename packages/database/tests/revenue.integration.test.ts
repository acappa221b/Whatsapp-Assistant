import { InMemoryEventBus } from '@finance-ai/core/events'
import {
  CreateRevenueUseCase,
  GetRevenueByIdUseCase,
  ListRevenuesUseCase,
  SoftDeleteRevenueUseCase,
  UpdateRevenueUseCase,
} from '@finance-ai/core/domains/revenue'
import { RevenuePrismaRepository } from '@finance-ai/database'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database.ts'

describe('RevenuePrismaRepository integration', () => {
  let db: TestDatabase
  let repository: RevenuePrismaRepository
  const eventBus = new InMemoryEventBus()

  beforeAll(() => {
    db = createIsolatedTestDatabase()
    repository = new RevenuePrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  it('Create', async () => {
    const created = await new CreateRevenueUseCase(repository, eventBus).execute({
      description: 'Venda',
      amount: 500,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    expect(created.amount).toBe(500)
  })

  it('Update', async () => {
    const created = await new CreateRevenueUseCase(repository, eventBus).execute({
      description: 'Venda',
      amount: 500,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    const updated = await new UpdateRevenueUseCase(repository, eventBus).execute({
      id: created.id,
      amount: 750,
    })
    expect(updated.amount).toBe(750)
  })

  it('GetById', async () => {
    const created = await new CreateRevenueUseCase(repository, eventBus).execute({
      description: 'Venda',
      amount: 500,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    const found = await new GetRevenueByIdUseCase(repository).execute(created.id)
    expect(found.id).toBe(created.id)
  })

  it('List', async () => {
    await new CreateRevenueUseCase(repository, eventBus).execute({
      description: 'A',
      amount: 100,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    await new CreateRevenueUseCase(repository, eventBus).execute({
      description: 'B',
      amount: 200,
      date: new Date('2025-01-16'),
      source: 'MANUAL',
    })
    const result = await new ListRevenuesUseCase(repository).execute({}, { page: 1, limit: 10 })
    expect(result.total).toBe(2)
  })

  it('SoftDelete', async () => {
    const created = await new CreateRevenueUseCase(repository, eventBus).execute({
      description: 'Venda',
      amount: 500,
      date: new Date('2025-01-15'),
      source: 'MANUAL',
    })
    const deleted = await new SoftDeleteRevenueUseCase(repository, eventBus).execute(created.id)
    expect(deleted.deletedAt).not.toBeNull()
    const list = await new ListRevenuesUseCase(repository).execute({}, { page: 1, limit: 10 })
    expect(list.total).toBe(0)
  })
})
