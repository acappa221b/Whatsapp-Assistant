import type { PrismaClient } from '@prisma/client'
import type { PaginatedResult, PaginationInput } from '@finance-ai/core/events'
import type { ExpenseListFilters, ExpenseRepository } from '@finance-ai/core/domains/expense'
import type { Expense } from '@finance-ai/core/domains/expense'
import { ExpenseMapper } from '../mappers/expense.mapper'

export class ExpensePrismaRepository implements ExpenseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(expense: Expense): Promise<Expense> {
    const data = ExpenseMapper.toPersistence(expense)
    const saved = await this.prisma.expense.upsert({
      where: { id: expense.id },
      create: data,
      update: data,
    })
    return ExpenseMapper.toDomain(saved)
  }

  async findById(id: string): Promise<Expense | null> {
    const record = await this.prisma.expense.findUnique({ where: { id } })
    return record ? ExpenseMapper.toDomain(record) : null
  }

  async findMany(
    filters: ExpenseListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Expense>> {
    const where: { deletedAt?: null; categoryId?: string } = {}
    if (!filters.includeDeleted) {
      where.deletedAt = null
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId
    }
    const skip = (pagination.page - 1) * pagination.limit
    const [records, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      this.prisma.expense.count({ where }),
    ])
    return {
      items: records.map(ExpenseMapper.toDomain),
      total,
      page: pagination.page,
      limit: pagination.limit,
    }
  }
}
