import type { PrismaClient } from '@prisma/client'
import type { PaginatedResult, PaginationInput } from '@finance-ai/core/events'
import type { RevenueListFilters, RevenueRepository } from '@finance-ai/core/domains/revenue'
import type { Revenue } from '@finance-ai/core/domains/revenue'
import { RevenueMapper } from '../mappers/revenue.mapper'

export class RevenuePrismaRepository implements RevenueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(revenue: Revenue): Promise<Revenue> {
    const data = RevenueMapper.toPersistence(revenue)
    const saved = await this.prisma.revenue.upsert({
      where: { id: revenue.id },
      create: data,
      update: data,
    })
    return RevenueMapper.toDomain(saved)
  }

  async findById(id: string): Promise<Revenue | null> {
    const record = await this.prisma.revenue.findUnique({ where: { id } })
    return record ? RevenueMapper.toDomain(record) : null
  }

  async findMany(
    filters: RevenueListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Revenue>> {
    const where: { deletedAt?: null } = {}
    if (!filters.includeDeleted) {
      where.deletedAt = null
    }
    const skip = (pagination.page - 1) * pagination.limit
    const [records, total] = await Promise.all([
      this.prisma.revenue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      this.prisma.revenue.count({ where }),
    ])
    return {
      items: records.map(RevenueMapper.toDomain),
      total,
      page: pagination.page,
      limit: pagination.limit,
    }
  }
}
