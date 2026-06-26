import type { PaginatedResult, PaginationInput } from '../../../events/index'
import { Revenue } from '../domain/revenue.entity'
import type { RevenueListFilters, RevenueRepository } from '../domain/revenue.repository'

export class InMemoryRevenueRepository implements RevenueRepository {
  private store = new Map<string, Revenue>()

  async save(revenue: Revenue): Promise<Revenue> {
    this.store.set(revenue.id, revenue)
    return revenue
  }

  async findById(id: string): Promise<Revenue | null> {
    return this.store.get(id) ?? null
  }

  async findMany(
    filters: RevenueListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<Revenue>> {
    let items = [...this.store.values()]
    if (!filters.includeDeleted) {
      items = items.filter((r) => !r.isDeleted)
    }
    const total = items.length
    const start = (pagination.page - 1) * pagination.limit
    const paged = items.slice(start, start + pagination.limit)
    return { items: paged, total, page: pagination.page, limit: pagination.limit }
  }
}
