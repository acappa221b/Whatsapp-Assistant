import { AlreadyDeletedError, NotFoundError } from '../../../domain/errors'
import { DomainEvents, type EventBus, type PaginatedResult, type PaginationInput } from '../../../events/index'
import { generateId } from '../../../domain/utils'
import type { ExpenseSource } from '../../../domain/value-objects/enums'
import { Revenue } from '../domain/revenue.entity'
import type { RevenueListFilters, RevenueRepository } from '../domain/revenue.repository'

export type CreateRevenueInput = {
  description: string
  amount: number
  date: Date
  source: ExpenseSource
}

export class CreateRevenueUseCase {
  constructor(
    private readonly repository: RevenueRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateRevenueInput): Promise<Revenue> {
    const revenue = Revenue.create({
      id: generateId(),
      description: input.description,
      amount: input.amount,
      date: input.date,
      source: input.source,
    })
    const saved = await this.repository.save(revenue)
    await this.eventBus.publish({
      name: DomainEvents.RevenueCreated,
      payload: { revenueId: saved.id, amount: saved.amount, source: saved.source },
      occurredAt: new Date(),
    })
    return saved
  }
}

export type UpdateRevenueInput = {
  id: string
  description?: string
  amount?: number
  date?: Date
}

export class UpdateRevenueUseCase {
  constructor(
    private readonly repository: RevenueRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateRevenueInput): Promise<Revenue> {
    const existing = await this.repository.findById(input.id)
    if (!existing) throw new NotFoundError('Revenue', input.id)
    const updated = existing.update(input)
    const saved = await this.repository.save(updated)
    await this.eventBus.publish({
      name: DomainEvents.RevenueUpdated,
      payload: { revenueId: saved.id, changes: input },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class SoftDeleteRevenueUseCase {
  constructor(
    private readonly repository: RevenueRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string): Promise<Revenue> {
    const existing = await this.repository.findById(id)
    if (!existing) throw new NotFoundError('Revenue', id)
    if (existing.isDeleted) throw new AlreadyDeletedError('Revenue')
    const deleted = existing.softDelete()
    const saved = await this.repository.save(deleted)
    await this.eventBus.publish({
      name: DomainEvents.RevenueSoftDeleted,
      payload: { revenueId: saved.id, deletedAt: saved.deletedAt },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class GetRevenueByIdUseCase {
  constructor(private readonly repository: RevenueRepository) {}

  async execute(id: string, includeDeleted = false): Promise<Revenue> {
    const revenue = await this.repository.findById(id)
    if (!revenue) throw new NotFoundError('Revenue', id)
    if (revenue.isDeleted && !includeDeleted) {
      throw new NotFoundError('Revenue', id)
    }
    return revenue
  }
}

export class ListRevenuesUseCase {
  constructor(private readonly repository: RevenueRepository) {}

  async execute(
    filters: RevenueListFilters = {},
    pagination: PaginationInput = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<Revenue>> {
    return this.repository.findMany(filters, pagination)
  }
}
