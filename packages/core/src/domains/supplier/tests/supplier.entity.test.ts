import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { Supplier } from '../domain/supplier.entity'

describe('Supplier entity', () => {
  it('creates with document and updates', () => {
    const supplier = Supplier.create({ id: '1', name: 'Acme Corp', document: '12345678901' })
    expect(supplier.document).toBe('12345678901')
    const updated = supplier.update({ name: 'Acme Updated', document: '999' })
    expect(updated.name).toBe('Acme Updated')
  })

  it('rejects short name', () => {
    expect(() => Supplier.create({ id: '1', name: 'A' })).toThrow(ValidationError)
  })

  it('rejects long name', () => {
    expect(() => Supplier.create({ id: '1', name: 'x'.repeat(201) })).toThrow(ValidationError)
  })
})
