import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { Expense } from '../domain/expense.entity'

describe('Expense entity', () => {
  const base = {
    id: '1',
    description: 'Test',
    amount: 10,
    categoryId: 'cat',
    date: new Date(),
    source: 'MANUAL' as const,
  }

  it('reconstitutes and updates fields', () => {
    const expense = Expense.create(base)
    const updated = expense.update({ description: 'New', amount: 20, categoryId: 'c2', date: new Date() })
    expect(updated.description).toBe('New')
    expect(updated.amount).toBe(20)
  })

  it('rejects long description', () => {
    expect(() => Expense.validateDescription('x'.repeat(501))).toThrow(ValidationError)
  })

  it('rejects soft delete twice', () => {
    const expense = Expense.create(base)
    const deleted = expense.softDelete()
    expect(() => deleted.softDelete()).toThrow(ValidationError)
  })

  it('updates supplierId on expense', () => {
    const expense = Expense.create({
      id: '1',
      description: 'T',
      amount: 10,
      categoryId: 'c',
      date: new Date(),
      source: 'MANUAL',
    })
    const updated = expense.update({ supplierId: 'sup-1' })
    expect(updated.supplierId).toBe('sup-1')
  })
})
