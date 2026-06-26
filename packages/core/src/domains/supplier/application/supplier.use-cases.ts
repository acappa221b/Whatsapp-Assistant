import { AlreadyDeletedError, NotFoundError } from '../../../domain/errors'
import { DomainEvents, type EventBus } from '../../../events/index'
import { generateId } from '../../../domain/utils'
import { Supplier } from '../domain/supplier.entity'
import type { SupplierRepository } from '../domain/supplier.repository'
import { assertUniqueSupplierName } from '../infrastructure/in-memory-supplier.repository'

export type CreateSupplierInput = { name: string; document?: string | null }

export class CreateSupplierUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateSupplierInput): Promise<Supplier> {
    await assertUniqueSupplierName(this.repository, input.name)
    const supplier = Supplier.create({
      id: generateId(),
      name: input.name,
      document: input.document,
    })
    const saved = await this.repository.save(supplier)
    await this.eventBus.publish({
      name: DomainEvents.SupplierCreated,
      payload: { supplierId: saved.id, name: saved.name },
      occurredAt: new Date(),
    })
    return saved
  }
}

export type UpdateSupplierInput = {
  id: string
  name?: string
  document?: string | null
}

export class UpdateSupplierUseCase {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateSupplierInput): Promise<Supplier> {
    const existing = await this.repository.findById(input.id)
    if (!existing) throw new NotFoundError('Supplier', input.id)
    if (input.name) await assertUniqueSupplierName(this.repository, input.name, existing.id)
    const updated = existing.update({ name: input.name, document: input.document })
    const saved = await this.repository.save(updated)
    await this.eventBus.publish({
      name: DomainEvents.SupplierUpdated,
      payload: { supplierId: saved.id, changes: { name: saved.name, document: saved.document } },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class SoftDeleteSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  async execute(id: string): Promise<Supplier> {
    const existing = await this.repository.findById(id)
    if (!existing) throw new NotFoundError('Supplier', id)
    if (existing.isDeleted) throw new AlreadyDeletedError('Supplier')
    const deleted = existing.softDelete()
    return this.repository.save(deleted)
  }
}

export class GetSupplierByIdUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  async execute(id: string): Promise<Supplier> {
    const supplier = await this.repository.findById(id)
    if (!supplier) throw new NotFoundError('Supplier', id)
    return supplier
  }
}

export class ListSuppliersUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  async execute(): Promise<Supplier[]> {
    return this.repository.findAllActive()
  }
}
