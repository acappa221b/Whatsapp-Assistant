import { ValidationError } from '@finance-ai/shared/errors'
import { AlreadyDeletedError, NotFoundError } from '../../../domain/errors'
import { DomainEvents, type EventBus, type PaginatedResult, type PaginationInput } from '../../../events/index'
import { generateId } from '../../../domain/utils'
import type { ExpenseSource } from '../../../domain/value-objects/enums'
import type { CategoryRepository } from '../../category/domain/category.repository'
import type { SupplierRepository } from '../../supplier/domain/supplier.repository'
import { Expense } from '../domain/expense.entity'
import type { ExpenseListFilters, ExpenseRepository } from '../domain/expense.repository'

export type CreateExpenseInput = {
  description: string
  amount: number
  categoryId: string
  supplierId?: string | null
  date: Date
  source: ExpenseSource
  confidence?: number
}

export class CreateExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly supplierRepository: SupplierRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateExpenseInput): Promise<Expense> {
    const category = await this.categoryRepository.findById(input.categoryId)
    if (!category) throw new NotFoundError('Category', input.categoryId)
    if (category.type !== 'EXPENSE') {
      throw new ValidationError('Category must be of type EXPENSE')
    }
    if (input.supplierId) {
      const supplier = await this.supplierRepository.findById(input.supplierId)
      if (!supplier) throw new NotFoundError('Supplier', input.supplierId)
      if (supplier.isDeleted) {
        throw new ValidationError('Supplier is deleted')
      }
    }
    const expense = Expense.create({
      id: generateId(),
      description: input.description,
      amount: input.amount,
      categoryId: input.categoryId,
      supplierId: input.supplierId,
      date: input.date,
      source: input.source,
      confidence: input.confidence,
    })
    const saved = await this.expenseRepository.save(expense)
    await this.eventBus.publish({
      name: DomainEvents.ExpenseCreated,
      payload: {
        expenseId: saved.id,
        amount: saved.amount,
        categoryId: saved.categoryId,
        source: saved.source,
        confidence: saved.confidence,
      },
      occurredAt: new Date(),
    })
    return saved
  }
}

export type UpdateExpenseInput = {
  id: string
  description?: string
  amount?: number
  categoryId?: string
  supplierId?: string | null
  date?: Date
}

export class UpdateExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateExpenseInput): Promise<Expense> {
    const existing = await this.expenseRepository.findById(input.id)
    if (!existing) throw new NotFoundError('Expense', input.id)
    if (input.categoryId) {
      const category = await this.categoryRepository.findById(input.categoryId)
      if (!category) throw new NotFoundError('Category', input.categoryId)
      if (category.type !== 'EXPENSE') {
        throw new ValidationError('Category must be of type EXPENSE')
      }
    }
    const updated = existing.update(input)
    const saved = await this.expenseRepository.save(updated)
    await this.eventBus.publish({
      name: DomainEvents.ExpenseUpdated,
      payload: { expenseId: saved.id, changes: input },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class SoftDeleteExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string): Promise<Expense> {
    const existing = await this.expenseRepository.findById(id)
    if (!existing) throw new NotFoundError('Expense', id)
    if (existing.isDeleted) throw new AlreadyDeletedError('Expense')
    const deleted = existing.softDelete()
    const saved = await this.expenseRepository.save(deleted)
    await this.eventBus.publish({
      name: DomainEvents.ExpenseSoftDeleted,
      payload: { expenseId: saved.id, deletedAt: saved.deletedAt },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class GetExpenseByIdUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(id: string, includeDeleted = false): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id)
    if (!expense) throw new NotFoundError('Expense', id)
    if (expense.isDeleted && !includeDeleted) {
      throw new NotFoundError('Expense', id)
    }
    return expense
  }
}

export class ListExpensesUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(
    filters: ExpenseListFilters = {},
    pagination: PaginationInput = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<Expense>> {
    return this.expenseRepository.findMany(filters, pagination)
  }
}
