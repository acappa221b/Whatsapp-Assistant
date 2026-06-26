import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents, InMemoryEventBus, type EventBus } from '../../../events/index'
import { InMemoryRevenueRepository } from '../infrastructure/in-memory-revenue.repository'
import {
  CreateRevenueUseCase,
  GetRevenueByIdUseCase,
  ListRevenuesUseCase,
  SoftDeleteRevenueUseCase,
  UpdateRevenueUseCase,
} from '../application/revenue.use-cases'
import { ValidationError } from '@finance-ai/shared/errors'
import { NotFoundError } from '../../../domain/errors'
import type { RevenueRepository } from '../domain/revenue.repository'

describe('Epic 02 — Revenue domain', () => {
  let bus: EventBus
  let repo: RevenueRepository

  beforeEach(() => {
    bus = new InMemoryEventBus()
    repo = new InMemoryRevenueRepository()
  })

  it('REV-001 creates revenue', async () => {
    const handler = vi.fn()
    bus.subscribe(DomainEvents.RevenueCreated, handler)
    const revenue = await new CreateRevenueUseCase(repo, bus).execute({
      description: 'Venda',
      amount: 5000,
      date: new Date(),
      source: 'MANUAL',
    })
    expect(revenue.deletedAt).toBeNull()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('REV-002 rejects negative amount', async () => {
    await expect(
      new CreateRevenueUseCase(repo, bus).execute({
        description: 'Xy',
        amount: -1,
        date: new Date(),
        source: 'MANUAL',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('REV-006 soft delete', async () => {
    const created = await new CreateRevenueUseCase(repo, bus).execute({
      description: 'Vv',
      amount: 100,
      date: new Date(),
      source: 'MANUAL',
    })
    const handler = vi.fn()
    bus.subscribe(DomainEvents.RevenueSoftDeleted, handler)
    await new SoftDeleteRevenueUseCase(repo, bus).execute(created.id)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('REV-008 list excludes deleted', async () => {
    const create = new CreateRevenueUseCase(repo, bus)
    const a = await create.execute({ description: 'Aa', amount: 1, date: new Date(), source: 'MANUAL' })
    await create.execute({ description: 'Bb', amount: 2, date: new Date(), source: 'MANUAL' })
    await new SoftDeleteRevenueUseCase(repo, bus).execute(a.id)
    const list = await new ListRevenuesUseCase(repo).execute()
    expect(list.items).toHaveLength(1)
  })

  it('REV-007 get by id', async () => {
    const created = await new CreateRevenueUseCase(repo, bus).execute({
      description: 'Find',
      amount: 10,
      date: new Date(),
      source: 'MANUAL',
    })
    const found = await new GetRevenueByIdUseCase(repo).execute(created.id)
    expect(found.id).toBe(created.id)
    await expect(new GetRevenueByIdUseCase(repo).execute('x')).rejects.toThrow(NotFoundError)
  })

  it('REV-007 get deleted with includeDeleted', async () => {
    const created = await new CreateRevenueUseCase(repo, bus).execute({
      description: 'Del Rev',
      amount: 10,
      date: new Date(),
      source: 'MANUAL',
    })
    await new SoftDeleteRevenueUseCase(repo, bus).execute(created.id)
    await expect(new GetRevenueByIdUseCase(repo).execute(created.id)).rejects.toThrow(NotFoundError)
    const found = await new GetRevenueByIdUseCase(repo).execute(created.id, true)
    expect(found.isDeleted).toBe(true)
  })

  it('REV-004 update active revenue', async () => {
    const created = await new CreateRevenueUseCase(repo, bus).execute({
      description: 'Upd',
      amount: 100,
      date: new Date(),
      source: 'MANUAL',
    })
    const handler = vi.fn()
    bus.subscribe(DomainEvents.RevenueUpdated, handler)
    const updated = await new UpdateRevenueUseCase(repo, bus).execute({ id: created.id, amount: 200 })
    expect(updated.amount).toBe(200)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('REV-005 rejects update deleted', async () => {
    const created = await new CreateRevenueUseCase(repo, bus).execute({
      description: 'Vv',
      amount: 100,
      date: new Date(),
      source: 'MANUAL',
    })
    await new SoftDeleteRevenueUseCase(repo, bus).execute(created.id)
    await expect(
      new UpdateRevenueUseCase(repo, bus).execute({ id: created.id, amount: 200 }),
    ).rejects.toThrow(ValidationError)
  })
})
