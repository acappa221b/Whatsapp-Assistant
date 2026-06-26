import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { Revenue } from '../domain/revenue.entity'

describe('Revenue entity', () => {
  const base = {
    id: '1',
    description: 'Rev',
    amount: 100,
    date: new Date(),
    source: 'MANUAL' as const,
  }

  it('updates fields', () => {
    const revenue = Revenue.create(base)
    const updated = revenue.update({ description: 'New', amount: 200, date: new Date() })
    expect(updated.amount).toBe(200)
  })

  it('rejects empty description', () => {
    expect(() => Revenue.validateDescription('')).toThrow(ValidationError)
  })

  it('rejects double soft delete', () => {
    const revenue = Revenue.create(base)
    const deleted = revenue.softDelete()
    expect(() => deleted.softDelete()).toThrow(ValidationError)
  })

  it('rejects update when deleted', () => {
    const revenue = Revenue.create(base).softDelete()
    expect(() => revenue.update({ amount: 50 })).toThrow(ValidationError)
  })
})
