import type { Revenue as PrismaRevenue } from '@prisma/client'
import { Revenue } from '@finance-ai/core/domains/revenue'
import type { ExpenseSource } from '@finance-ai/core/domain/value-objects/enums'

export type RevenuePersistence = {
  id: string
  description: string
  amount: number
  date: Date
  source: ExpenseSource
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const RevenueMapper = {
  toDomain(record: PrismaRevenue): Revenue {
    return Revenue.reconstitute({
      id: record.id,
      description: record.description,
      amount: record.amount,
      date: record.date,
      source: record.source as ExpenseSource,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    })
  },

  toPersistence(revenue: Revenue): RevenuePersistence {
    return {
      id: revenue.id,
      description: revenue.description,
      amount: revenue.amount,
      date: revenue.date,
      source: revenue.source,
      createdAt: revenue.createdAt,
      updatedAt: revenue.updatedAt,
      deletedAt: revenue.deletedAt,
    }
  },
}
