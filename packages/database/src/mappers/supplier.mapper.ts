import type { Supplier as PrismaSupplier } from '@prisma/client'
import { Supplier } from '@finance-ai/core/domains/supplier'

export type SupplierPersistence = {
  id: string
  name: string
  document: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const SupplierMapper = {
  toDomain(record: PrismaSupplier): Supplier {
    return Supplier.reconstitute({
      id: record.id,
      name: record.name,
      document: record.document,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    })
  },

  toPersistence(supplier: Supplier): SupplierPersistence {
    return {
      id: supplier.id,
      name: supplier.name,
      document: supplier.document,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      deletedAt: supplier.deletedAt,
    }
  },
}
