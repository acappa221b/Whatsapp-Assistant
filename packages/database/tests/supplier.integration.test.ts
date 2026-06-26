import { InMemoryEventBus } from '@finance-ai/core/events'
import {
  CreateSupplierUseCase,
  GetSupplierByIdUseCase,
  ListSuppliersUseCase,
  SoftDeleteSupplierUseCase,
  UpdateSupplierUseCase,
} from '@finance-ai/core/domains/supplier'
import { SupplierPrismaRepository } from '@finance-ai/database'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database.ts'

describe('SupplierPrismaRepository integration', () => {
  let db: TestDatabase
  let repository: SupplierPrismaRepository
  const eventBus = new InMemoryEventBus()

  beforeAll(() => {
    db = createIsolatedTestDatabase()
    repository = new SupplierPrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  it('Create', async () => {
    const created = await new CreateSupplierUseCase(repository, eventBus).execute({
      name: 'Fornecedor A',
      document: '12345678901',
    })
    expect(created.name).toBe('Fornecedor A')
  })

  it('Update', async () => {
    const created = await new CreateSupplierUseCase(repository, eventBus).execute({
      name: 'Fornecedor A',
    })
    const updated = await new UpdateSupplierUseCase(repository, eventBus).execute({
      id: created.id,
      name: 'Fornecedor B',
    })
    expect(updated.name).toBe('Fornecedor B')
  })

  it('GetById', async () => {
    const created = await new CreateSupplierUseCase(repository, eventBus).execute({
      name: 'Fornecedor A',
    })
    const found = await new GetSupplierByIdUseCase(repository).execute(created.id)
    expect(found.id).toBe(created.id)
  })

  it('List', async () => {
    await new CreateSupplierUseCase(repository, eventBus).execute({ name: 'Sup A' })
    await new CreateSupplierUseCase(repository, eventBus).execute({ name: 'Sup B' })
    const active = await new ListSuppliersUseCase(repository).execute()
    expect(active).toHaveLength(2)
  })

  it('SoftDelete', async () => {
    const created = await new CreateSupplierUseCase(repository, eventBus).execute({
      name: 'Fornecedor A',
    })
    const deleted = await new SoftDeleteSupplierUseCase(repository).execute(created.id)
    expect(deleted.deletedAt).not.toBeNull()
    const active = await new ListSuppliersUseCase(repository).execute()
    expect(active).toHaveLength(0)
  })
})
