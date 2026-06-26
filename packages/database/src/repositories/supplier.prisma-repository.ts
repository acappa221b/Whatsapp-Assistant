import type { PrismaClient } from '@prisma/client'
import { Supplier } from '@finance-ai/core/domains/supplier'
import type { SupplierRepository } from '@finance-ai/core/domains/supplier'
import { SupplierMapper } from '../mappers/supplier.mapper'

export class SupplierPrismaRepository implements SupplierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(supplier: Supplier): Promise<Supplier> {
    const data = SupplierMapper.toPersistence(supplier)
    const saved = await this.prisma.supplier.upsert({
      where: { id: supplier.id },
      create: data,
      update: data,
    })
    return SupplierMapper.toDomain(saved)
  }

  async findById(id: string): Promise<Supplier | null> {
    const record = await this.prisma.supplier.findUnique({ where: { id } })
    return record ? SupplierMapper.toDomain(record) : null
  }

  async findByName(name: string): Promise<Supplier | null> {
    const records = await this.prisma.supplier.findMany({ where: { deletedAt: null } })
    const match = records.find((record) => Supplier.namesEqual(record.name, name))
    return match ? SupplierMapper.toDomain(match) : null
  }

  async findAllActive(): Promise<Supplier[]> {
    const records = await this.prisma.supplier.findMany({ where: { deletedAt: null } })
    return records.map(SupplierMapper.toDomain)
  }
}
