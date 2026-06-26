import { describe, expect, it } from 'vitest'
import { NotFoundError, AlreadyDeletedError, ConflictError, ForbiddenError } from './errors'
import { validateFutureDate, normalizeName } from './utils'
import { Money } from './value-objects/money'
import { Email } from './value-objects/email'
import { UserRoleVO, ExpenseSourceVO, CategoryTypeVO } from './value-objects/enums'
import { ValidationError } from '@finance-ai/shared/errors'

describe('domain errors', () => {
  it('creates typed errors', () => {
    expect(new NotFoundError('X', '1').code).toBe('NOT_FOUND')
    expect(new ConflictError('dup').code).toBe('CONFLICT')
    expect(new ForbiddenError('no').code).toBe('FORBIDDEN')
    expect(new AlreadyDeletedError('E').code).toBe('ALREADY_DELETED')
  })
})

describe('domain utils', () => {
  it('normalizes names', () => {
    expect(normalizeName('  foo   bar  ')).toBe('foo bar')
  })

  it('rejects far future dates', () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    expect(() => validateFutureDate(future)).toThrow(ValidationError)
  })
})

describe('value objects extended', () => {
  it('rejects non-finite and invalid decimals', () => {
    expect(() => Money.create(NaN)).toThrow(ValidationError)
    expect(() => Money.create(-5)).toThrow(ValidationError)
    expect(() => Money.create(1.234)).toThrow(ValidationError)
  })

  it('validates enums', () => {
    expect(() => UserRoleVO.create('INVALID')).toThrow(ValidationError)
    expect(() => ExpenseSourceVO.create('BAD')).toThrow(ValidationError)
    expect(() => CategoryTypeVO.create('BAD')).toThrow(ValidationError)
  })

  it('email equality', () => {
    const a = Email.create('a@b.com')
    const b = Email.create('a@b.com')
    expect(a.equals(b)).toBe(true)
  })
})
