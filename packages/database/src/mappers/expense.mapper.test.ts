import { Expense } from '@finance-ai/core/domains/expense'
import { describe, it, expect } from 'vitest'
import { ExpenseMapper } from './expense.mapper.ts'

describe('ExpenseMapper', () => {
  const expense = Expense.create({
    id: 'exp-1',
    description: 'Test expense',
    amount: 99.99,
    categoryId: 'cat-1',
    supplierId: 'sup-1',
    date: new Date('2025-06-01T12:00:00Z'),
    source: 'WHATSAPP_TEXT',
    confidence: 0.85,
    now: new Date('2025-06-01T10:00:00Z'),
  })

  it('round-trips through toPersistence and toDomain', () => {
    const persistence = ExpenseMapper.toPersistence(expense)
    const restored = ExpenseMapper.toDomain({
      ...persistence,
      source: persistence.source,
    })
    expect(restored.id).toBe(expense.id)
    expect(restored.description).toBe(expense.description)
    expect(restored.amount).toBe(expense.amount)
    expect(restored.source).toBe(expense.source)
    expect(restored.confidence).toBe(expense.confidence)
  })
})
