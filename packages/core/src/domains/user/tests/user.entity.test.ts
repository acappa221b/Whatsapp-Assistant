import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { User } from '../domain/user.entity'

describe('User entity', () => {
  it('updates all fields', () => {
    const user = User.create({ id: '1', name: 'Old Name', email: 'old@test.com', role: 'VIEWER' })
    const updated = user.update({ name: 'New Name', email: 'new@test.com', role: 'ADMIN' })
    expect(updated.role).toBe('ADMIN')
    expect(updated.email).toBe('new@test.com')
  })

  it('rejects short name', () => {
    expect(() => User.create({ id: '1', name: 'A', email: 'a@b.com' })).toThrow(ValidationError)
  })

  it('rejects long name', () => {
    expect(() => User.create({ id: '1', name: 'x'.repeat(151), email: 'a@b.com' })).toThrow(ValidationError)
  })
})
