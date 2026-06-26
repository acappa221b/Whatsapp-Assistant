import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { Category } from '../domain/category.entity'

describe('Category entity', () => {
  it('reconstitutes', () => {
    const now = new Date()
    const cat = Category.reconstitute({ id: '1', name: 'Food', type: 'EXPENSE', createdAt: now, updatedAt: now })
    expect(cat.name).toBe('Food')
  })

  it('rejects long name', () => {
    expect(() => Category.create({ id: '1', name: 'x'.repeat(101), type: 'EXPENSE' })).toThrow(ValidationError)
  })

  it('compares names case-insensitively', () => {
    expect(Category.namesEqual('Food', 'food')).toBe(true)
  })
})
