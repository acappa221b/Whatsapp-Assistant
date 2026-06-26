import type { PaginatedResult, PaginationInput } from '../../../events/index'
import { Expense } from '../domain/expense.entity'
import type { ExpenseListFilters, ExpenseRepository } from '../domain/expense.repository'

export class InMemoryExpenseRepository implements ExpenseRepository {
  private store = new Map<string, Expense>()

  async save(expense: Expense): Promise<Expense> {
    this.store.set(expense.id, expense)
    return expense
  }

  async findById(id: string): Promise<Expense | null> {
    return this.store.get(id) ?? null
  }

  async findMany(
    filters: ExpenseListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Expense>> {
    let items = [...this.store.values()]
    if (!filters.includeDeleted) {
      items = items.filter((e) => !e.isDeleted)
    }
    if (filters.categoryId) {
      items = items.filter((e) => e.categoryId === filters.categoryId)
    }
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const total = items.length
    const start = (pagination.page - 1) * pagination.limit
    const paged = items.slice(start, start + pagination.limit)
    return { items: paged, total, page: pagination.page, limit: pagination.limit }
  }
}
