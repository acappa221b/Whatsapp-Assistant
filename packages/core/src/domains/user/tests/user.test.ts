import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents, InMemoryEventBus, type EventBus } from '../../../events/index'
import { InMemoryUserRepository } from '../infrastructure/in-memory-user.repository'
import {
  CreateUserUseCase,
  GetUserByIdUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
} from '../application/user.use-cases'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../domain/errors'
import { ValidationError } from '@finance-ai/shared/errors'
import type { UserRepository } from '../domain/user.repository'

describe('Epic 02 — User domain', () => {
  let bus: EventBus
  let repo: UserRepository

  beforeEach(() => {
    bus = new InMemoryEventBus()
    repo = new InMemoryUserRepository()
  })

  it('USR-001 creates VIEWER', async () => {
    const handler = vi.fn()
    bus.subscribe(DomainEvents.UserCreated, handler)
    const user = await new CreateUserUseCase(repo, bus).execute({
      name: 'Alex',
      email: 'alex@test.com',
      role: 'VIEWER',
    })
    expect(user.role).toBe('VIEWER')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('USR-002 rejects duplicate email', async () => {
    await new CreateUserUseCase(repo, bus).execute({ name: 'User One', email: 'dup@test.com' })
    await expect(
      new CreateUserUseCase(repo, bus).execute({ name: 'User Two', email: 'dup@test.com' }),
    ).rejects.toThrow(ConflictError)
  })

  it('USR-003 normalizes email', async () => {
    const user = await new CreateUserUseCase(repo, bus).execute({
      name: 'Test User',
      email: 'User@Test.COM',
    })
    expect(user.email).toBe('user@test.com')
  })

  it('USR-004 rejects invalid email', async () => {
    await expect(
      new CreateUserUseCase(repo, bus).execute({ name: 'Bad Email', email: 'not-email' }),
    ).rejects.toThrow(ValidationError)
  })

  it('USR-008 ADMIN can list users', async () => {
    await new CreateUserUseCase(repo, bus).execute({ name: 'Admin User', email: 'a@test.com' })
    const list = await new ListUsersUseCase(repo).execute('ADMIN')
    expect(list.length).toBeGreaterThan(0)
  })

  it('USR-008 VIEWER cannot list users', async () => {
    await expect(new ListUsersUseCase(repo).execute('VIEWER')).rejects.toThrow(ForbiddenError)
  })

  it('USR-007 get by id', async () => {
    const user = await new CreateUserUseCase(repo, bus).execute({ name: 'Find Me', email: 'find@test.com' })
    const found = await new GetUserByIdUseCase(repo).execute(user.id)
    expect(found.email).toBe('find@test.com')
    await expect(new GetUserByIdUseCase(repo).execute('missing')).rejects.toThrow(NotFoundError)
  })

  it('USR-005 updates role', async () => {
    const user = await new CreateUserUseCase(repo, bus).execute({ name: 'Manager User', email: 'm@test.com' })
    const handler = vi.fn()
    bus.subscribe(DomainEvents.UserUpdated, handler)
    const updated = await new UpdateUserUseCase(repo, bus).execute({ id: user.id, role: 'MANAGER' })
    expect(updated.role).toBe('MANAGER')
    expect(handler).toHaveBeenCalledOnce()
  })
})
