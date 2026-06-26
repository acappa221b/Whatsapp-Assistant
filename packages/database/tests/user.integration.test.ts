import { InMemoryEventBus } from '@finance-ai/core/events'
import {
  CreateUserUseCase,
  GetUserByIdUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
} from '@finance-ai/core/domains/user'
import { UserPrismaRepository } from '@finance-ai/database'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database.ts'

describe('UserPrismaRepository integration', () => {
  let db: TestDatabase
  let repository: UserPrismaRepository
  const eventBus = new InMemoryEventBus()

  beforeAll(() => {
    db = createIsolatedTestDatabase()
    repository = new UserPrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  it('Create', async () => {
    const created = await new CreateUserUseCase(repository, eventBus).execute({
      name: 'Alexandre',
      email: 'alex@example.com',
      role: 'ADMIN',
    })
    expect(created.email).toBe('alex@example.com')
    expect(created.role).toBe('ADMIN')
  })

  it('Update', async () => {
    const created = await new CreateUserUseCase(repository, eventBus).execute({
      name: 'Alexandre',
      email: 'alex@example.com',
    })
    const updated = await new UpdateUserUseCase(repository, eventBus).execute({
      id: created.id,
      name: 'Alex',
      role: 'MANAGER',
    })
    expect(updated.name).toBe('Alex')
    expect(updated.role).toBe('MANAGER')
  })

  it('GetById', async () => {
    const created = await new CreateUserUseCase(repository, eventBus).execute({
      name: 'Alexandre',
      email: 'alex@example.com',
    })
    const found = await new GetUserByIdUseCase(repository).execute(created.id)
    expect(found.id).toBe(created.id)
  })

  it('List', async () => {
    await new CreateUserUseCase(repository, eventBus).execute({
      name: 'User A',
      email: 'a@example.com',
    })
    await new CreateUserUseCase(repository, eventBus).execute({
      name: 'User B',
      email: 'b@example.com',
    })
    const users = await new ListUsersUseCase(repository).execute('ADMIN')
    expect(users).toHaveLength(2)
  })
})
