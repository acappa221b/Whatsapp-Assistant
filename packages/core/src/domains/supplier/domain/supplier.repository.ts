import type { Supplier } from './supplier.entity'

export type SupplierRepository = {
  save(supplier: Supplier): Promise<Supplier>
  findById(id: string): Promise<Supplier | null>
  findByName(name: string): Promise<Supplier | null>
  findAllActive(): Promise<Supplier[]>
}
