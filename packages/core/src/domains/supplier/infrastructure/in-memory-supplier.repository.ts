import { ConflictError } from '../../../domain/errors'
import { Supplier } from '../domain/supplier.entity'
import type { SupplierRepository } from '../domain/supplier.repository'

export class InMemorySupplierRepository implements SupplierRepository {
  private store = new Map<string, Supplier>()

  async save(supplier: Supplier): Promise<Supplier> {
    this.store.set(supplier.id, supplier)
    return supplier
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.store.get(id) ?? null
  }

  async findByName(name: string): Promise<Supplier | null> {
    for (const supplier of this.store.values()) {
      if (!supplier.isDeleted && Supplier.namesEqual(supplier.name, name)) {
        return supplier
      }
    }
    return null
  }

  async findAllActive(): Promise<Supplier[]> {
    return [...this.store.values()].filter((s) => !s.isDeleted)
  }
}

export async function assertUniqueSupplierName(
  repository: SupplierRepository,
  name: string,
  excludeId?: string,
): Promise<void> {
  const existing = await repository.findByName(name)
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`Supplier "${name}" already exists`)
  }
}
