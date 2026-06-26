import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents, InMemoryEventBus, type EventBus } from '../../../events/index'
import { InMemoryCategoryRepository } from '../../category/infrastructure/in-memory-category.repository'
import { CreateCategoryUseCase } from '../../category/application/category.use-cases'
import { ValidationError } from '@finance-ai/shared/errors'
import { InMemoryExpenseRepository } from '../infrastructure/in-memory-expense.repository'
import { InMemorySupplierRepository } from '../../supplier/infrastructure/in-memory-supplier.repository'
import {
  CreateExpenseUseCase,
  GetExpenseByIdUseCase,
  ListExpensesUseCase,
  SoftDeleteExpenseUseCase,
  UpdateExpenseUseCase,
} from '../application/expense.use-cases'
import { CreateSupplierUseCase, SoftDeleteSupplierUseCase } from '../../supplier/application/supplier.use-cases'
import { NotFoundError, AlreadyDeletedError } from '../../../domain/errors'
import { Expense } from '../domain/expense.entity'
import { Money } from '../../../domain/value-objects/money'
import { ConfidenceScore } from '../../../domain/value-objects/confidence-score'
import type { CategoryRepository } from '../../category/domain/category.repository'
import type { ExpenseRepository } from '../domain/expense.repository'
import type { SupplierRepository } from '../../supplier/domain/supplier.repository'

describe('Epic 02 — Expense domain', () => {
  let bus: EventBus
  let categoryRepo: CategoryRepository
  let supplierRepo: SupplierRepository
  let expenseRepo: ExpenseRepository

  beforeEach(() => {
    bus = new InMemoryEventBus()
    categoryRepo = new InMemoryCategoryRepository()
    supplierRepo = new InMemorySupplierRepository()
    expenseRepo = new InMemoryExpenseRepository()
  })

  async function seedCategory(type: 'EXPENSE' | 'REVENUE' = 'EXPENSE') {
    return new CreateCategoryUseCase(categoryRepo, bus).execute({
      name: type === 'EXPENSE' ? `Alimentação-${crypto.randomUUID().slice(0, 8)}` : 'Salário Rev',
      type,
    })
  }

  it('EXP-001 creates manual expense with confidence 1.0', async () => {
    const category = await seedCategory()
    const handler = vi.fn()
    bus.subscribe(DomainEvents.ExpenseCreated, handler)
    const expense = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Almoço',
      amount: 100.5,
      categoryId: category.id,
      date: new Date(),
      source: 'MANUAL',
    })
    expect(expense.confidence).toBe(1)
    expect(expense.deletedAt).toBeNull()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('EXP-002 rejects zero amount', () => {
    expect(() => Money.create(0)).toThrow(ValidationError)
  })

  it('EXP-005 rejects REVENUE category', async () => {
    const category = await seedCategory('REVENUE')
    await expect(
      new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
        description: 'Test',
        amount: 10,
        categoryId: category.id,
        date: new Date(),
        source: 'MANUAL',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('EXP-009 OCR default confidence 0.5', async () => {
    const category = await seedCategory()
    const expense = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Nota',
      amount: 50,
      categoryId: category.id,
      date: new Date(),
      source: 'OCR',
    })
    expect(expense.confidence).toBe(0.5)
  })

  it('EXP-013 soft delete emits event', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Del',
      amount: 10,
      categoryId: category.id,
      date: new Date(),
      source: 'MANUAL',
    })
    const handler = vi.fn()
    bus.subscribe(DomainEvents.ExpenseSoftDeleted, handler)
    const deleted = await new SoftDeleteExpenseUseCase(expenseRepo, bus).execute(created.id)
    expect(deleted.deletedAt).not.toBeNull()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('EXP-012 rejects update on deleted expense', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Xy',
      amount: 10,
      categoryId: category.id,
      date: new Date(),
      source: 'MANUAL',
    })
    await new SoftDeleteExpenseUseCase(expenseRepo, bus).execute(created.id)
    await expect(
      new UpdateExpenseUseCase(expenseRepo, categoryRepo, bus).execute({ id: created.id, description: 'Yz' }),
    ).rejects.toThrow(ValidationError)
  })

  it('EXP-006 rejects missing category', async () => {
    await expect(
      new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
        description: 'Xy',
        amount: 10,
        categoryId: 'missing',
        date: new Date(),
        source: 'MANUAL',
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('EXP-007 creates with supplier', async () => {
    const category = await seedCategory()
    const supplier = await new CreateSupplierUseCase(supplierRepo, bus).execute({ name: 'Fornecedor Test' })
    const expense = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Com supplier',
      amount: 20,
      categoryId: category.id,
      supplierId: supplier.id,
      date: new Date(),
      source: 'MANUAL',
    })
    expect(expense.supplierId).toBe(supplier.id)
  })

  it('EXP-014 rejects double soft delete', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Del2',
      amount: 10,
      categoryId: category.id,
      date: new Date(),
      source: 'MANUAL',
    })
    await new SoftDeleteExpenseUseCase(expenseRepo, bus).execute(created.id)
    await expect(new SoftDeleteExpenseUseCase(expenseRepo, bus).execute(created.id)).rejects.toThrow(
      AlreadyDeletedError,
    )
  })

  it('EXP-015 get by id', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Get',
      amount: 10,
      categoryId: category.id,
      date: new Date(),
      source: 'MANUAL',
    })
    const found = await new GetExpenseByIdUseCase(expenseRepo).execute(created.id)
    expect(found.id).toBe(created.id)
  })

  it('EXP-016 get deleted with includeDeleted', async () => {
    const category = await seedCategory()
    const created = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'GetDel',
      amount: 10,
      categoryId: category.id,
      date: new Date(),
      source: 'MANUAL',
    })
    await new SoftDeleteExpenseUseCase(expenseRepo, bus).execute(created.id)
    await expect(new GetExpenseByIdUseCase(expenseRepo).execute(created.id)).rejects.toThrow(NotFoundError)
    const found = await new GetExpenseByIdUseCase(expenseRepo).execute(created.id, true)
    expect(found.isDeleted).toBe(true)
  })

  it('EXP-011 update with category change', async () => {
    const cat1 = await seedCategory()
    const cat2 = await new CreateCategoryUseCase(categoryRepo, bus).execute({
      name: `Cat2-${crypto.randomUUID().slice(0, 6)}`,
      type: 'EXPENSE',
    })
    const created = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'Upd',
      amount: 10,
      categoryId: cat1.id,
      date: new Date(),
      source: 'MANUAL',
    })
    const updated = await new UpdateExpenseUseCase(expenseRepo, categoryRepo, bus).execute({
      id: created.id,
      categoryId: cat2.id,
      amount: 15,
    })
    expect(updated.categoryId).toBe(cat2.id)
    expect(updated.amount).toBe(15)
  })

  it('EXP-005 rejects REVENUE category on update', async () => {
    const expenseCat = await seedCategory()
    const revenueCat = await new CreateCategoryUseCase(categoryRepo, bus).execute({
      name: `RevCat-${crypto.randomUUID().slice(0, 6)}`,
      type: 'REVENUE',
    })
    const created = await new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
      description: 'UpdCat',
      amount: 10,
      categoryId: expenseCat.id,
      date: new Date(),
      source: 'MANUAL',
    })
    await expect(
      new UpdateExpenseUseCase(expenseRepo, categoryRepo, bus).execute({
        id: created.id,
        categoryId: revenueCat.id,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('EXP-008 rejects deleted supplier', async () => {
    const category = await seedCategory()
    const supplier = await new CreateSupplierUseCase(supplierRepo, bus).execute({ name: 'Del Supplier' })
    await new SoftDeleteSupplierUseCase(supplierRepo).execute(supplier.id)
    await expect(
      new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus).execute({
        description: 'Bad sup',
        amount: 10,
        categoryId: category.id,
        supplierId: supplier.id,
        date: new Date(),
        source: 'MANUAL',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('EXP-017 list excludes deleted', async () => {
    const category = await seedCategory()
    const create = new CreateExpenseUseCase(expenseRepo, categoryRepo, supplierRepo, bus)
    for (let i = 0; i < 3; i++) {
      await create.execute({
        description: `E${i}`,
        amount: 10 + i,
        categoryId: category.id,
        date: new Date(),
        source: 'MANUAL',
      })
    }
    const all = await expenseRepo.findMany({}, { page: 1, limit: 10 })
    await new SoftDeleteExpenseUseCase(expenseRepo, bus).execute(all.items[0]!.id)
    const list = await new ListExpensesUseCase(expenseRepo).execute()
    expect(list.items).toHaveLength(2)
  })
})

describe('Value objects', () => {
  it('validates confidence range', () => {
    expect(() => ConfidenceScore.create(1.5)).toThrow(ValidationError)
    expect(ConfidenceScore.defaultForSource('MANUAL').value).toBe(1)
  })

  it('validates expense description', () => {
    expect(() => Expense.validateDescription('   ')).toThrow(ValidationError)
  })
})
