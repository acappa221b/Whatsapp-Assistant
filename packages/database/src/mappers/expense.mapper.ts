import type { Expense as PrismaExpense } from '@prisma/client'
import { Expense } from '@finance-ai/core/domains/expense'
import type { ExpenseSource } from '@finance-ai/core/domain/value-objects/enums'

export type ExpensePersistence = {
  id: string
  description: string
  amount: number
  categoryId: string
  supplierId: string | null
  date: Date
  source: ExpenseSource
  confidence: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const ExpenseMapper = {
  toDomain(record: PrismaExpense): Expense {
    return Expense.reconstitute({
      id: record.id,
      description: record.description,
      amount: record.amount,
      categoryId: record.categoryId,
      supplierId: record.supplierId,
      date: record.date,
      source: record.source as ExpenseSource,
      confidence: record.confidence,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    })
  },

  toPersistence(expense: Expense): ExpensePersistence {
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.categoryId,
      supplierId: expense.supplierId,
      date: expense.date,
      source: expense.source,
      confidence: expense.confidence,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      deletedAt: expense.deletedAt,
    }
  },
}
