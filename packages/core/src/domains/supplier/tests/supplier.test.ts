import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents, InMemoryEventBus, type EventBus } from '../../../events/index'
import { InMemorySupplierRepository } from '../infrastructure/in-memory-supplier.repository'
import {
  CreateSupplierUseCase,
  ListSuppliersUseCase,
  SoftDeleteSupplierUseCase,
  UpdateSupplierUseCase,
  GetSupplierByIdUseCase,
} from '../application/supplier.use-cases'
import { ConflictError, NotFoundError, AlreadyDeletedError } from '../../../domain/errors'
import { ValidationError } from '@finance-ai/shared/errors'
import type { SupplierRepository } from '../domain/supplier.repository'

describe('Epic 02 — Supplier domain', () => {
  let bus: EventBus
  let repo: SupplierRepository

  beforeEach(() => {
    bus = new InMemoryEventBus()
    repo = new InMemorySupplierRepository()
  })

  it('SUP-001 creates supplier', async () => {
    const handler = vi.fn()
    bus.subscribe(DomainEvents.SupplierCreated, handler)
    const s = await new CreateSupplierUseCase(repo, bus).execute({ name: 'Padaria Central' })
    expect(s.document).toBeNull()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('SUP-002 rejects duplicate name', async () => {
    await new CreateSupplierUseCase(repo, bus).execute({ name: 'Padaria' })
    await expect(new CreateSupplierUseCase(repo, bus).execute({ name: 'padaria' })).rejects.toThrow(
      ConflictError,
    )
  })

  it('SUP-005 rejects double soft delete', async () => {
    const s = await new CreateSupplierUseCase(repo, bus).execute({ name: 'Loja Test' })
    await new SoftDeleteSupplierUseCase(repo).execute(s.id)
    await expect(new SoftDeleteSupplierUseCase(repo).execute(s.id)).rejects.toThrow(AlreadyDeletedError)
  })

  it('SUP-005 soft delete', async () => {
    const s = await new CreateSupplierUseCase(repo, bus).execute({ name: 'Loja Test' })
    const deleted = await new SoftDeleteSupplierUseCase(repo).execute(s.id)
    expect(deleted.deletedAt).not.toBeNull()
    const list = await new ListSuppliersUseCase(repo).execute()
    expect(list).toHaveLength(0)
  })

  it('SUP-007 get by id', async () => {
    const s = await new CreateSupplierUseCase(repo, bus).execute({ name: 'Lookup Sup' })
    const found = await new GetSupplierByIdUseCase(repo).execute(s.id)
    expect(found.id).toBe(s.id)
    await expect(new GetSupplierByIdUseCase(repo).execute('missing')).rejects.toThrow(NotFoundError)
  })

  it('SUP-006 rejects update deleted', async () => {
    const s = await new CreateSupplierUseCase(repo, bus).execute({ name: 'Xy Shop' })
    await new SoftDeleteSupplierUseCase(repo).execute(s.id)
    await expect(new UpdateSupplierUseCase(repo, bus).execute({ id: s.id, name: 'Yz Shop' })).rejects.toThrow(
      ValidationError,
    )
  })
})
