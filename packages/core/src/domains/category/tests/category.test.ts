import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents, InMemoryEventBus, type EventBus } from '../../../events/index'
import { InMemoryCategoryRepository } from '../infrastructure/in-memory-category.repository'
import {
  CreateCategoryUseCase,
  GetCategoryByIdUseCase,
  ListCategoriesUseCase,
  UpdateCategoryUseCase,
} from '../application/category.use-cases'
import { ValidationError } from '@finance-ai/shared/errors'
import { ConflictError, NotFoundError } from '../../../domain/errors'
import type { CategoryRepository } from '../domain/category.repository'

describe('Epic 02 — Category domain', () => {
  let bus: EventBus
  let repo: CategoryRepository

  beforeEach(() => {
    bus = new InMemoryEventBus()
    repo = new InMemoryCategoryRepository()
  })

  it('CAT-001 creates EXPENSE category', async () => {
    const handler = vi.fn()
    bus.subscribe(DomainEvents.CategoryCreated, handler)
    const cat = await new CreateCategoryUseCase(repo, bus).execute({
      name: 'Alimentação',
      type: 'EXPENSE',
    })
    expect(cat.type).toBe('EXPENSE')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('CAT-002 rejects duplicate case-insensitive', async () => {
    await new CreateCategoryUseCase(repo, bus).execute({ name: 'Transporte', type: 'EXPENSE' })
    await expect(
      new CreateCategoryUseCase(repo, bus).execute({ name: 'transporte', type: 'EXPENSE' }),
    ).rejects.toThrow(ConflictError)
  })

  it('CAT-003 same name different types allowed', async () => {
    await new CreateCategoryUseCase(repo, bus).execute({ name: 'Salário', type: 'REVENUE' })
    const cat = await new CreateCategoryUseCase(repo, bus).execute({ name: 'Salário', type: 'EXPENSE' })
    expect(cat.type).toBe('EXPENSE')
  })

  it('CAT-008 list by type', async () => {
    await new CreateCategoryUseCase(repo, bus).execute({ name: 'Almoço', type: 'EXPENSE' })
    await new CreateCategoryUseCase(repo, bus).execute({ name: 'Vendas', type: 'REVENUE' })
    const list = await new ListCategoriesUseCase(repo).execute('EXPENSE')
    expect(list.every((c) => c.type === 'EXPENSE')).toBe(true)
  })

  it('CAT-004 rejects short name', async () => {
    await expect(
      new CreateCategoryUseCase(repo, bus).execute({ name: 'A', type: 'EXPENSE' }),
    ).rejects.toThrow(ValidationError)
  })

  it('CAT-007 get by id', async () => {
    const created = await new CreateCategoryUseCase(repo, bus).execute({ name: 'Lookup', type: 'EXPENSE' })
    const found = await new GetCategoryByIdUseCase(repo).execute(created.id)
    expect(found.name).toBe('Lookup')
    await expect(new GetCategoryByIdUseCase(repo).execute('missing')).rejects.toThrow(NotFoundError)
  })

  it('CAT-002 rejects duplicate on update', async () => {
    await new CreateCategoryUseCase(repo, bus).execute({ name: 'Unique One', type: 'EXPENSE' })
    const second = await new CreateCategoryUseCase(repo, bus).execute({ name: 'Unique Two', type: 'EXPENSE' })
    await expect(
      new UpdateCategoryUseCase(repo, bus).execute({ id: second.id, name: 'unique one' }),
    ).rejects.toThrow(ConflictError)
  })

  it('CAT-005 updates name', async () => {
    const created = await new CreateCategoryUseCase(repo, bus).execute({ name: 'Old Name', type: 'EXPENSE' })
    const handler = vi.fn()
    bus.subscribe(DomainEvents.CategoryUpdated, handler)
    const updated = await new UpdateCategoryUseCase(repo, bus).execute({ id: created.id, name: 'New Name' })
    expect(updated.name).toBe('New Name')
    expect(handler).toHaveBeenCalledOnce()
  })
})
