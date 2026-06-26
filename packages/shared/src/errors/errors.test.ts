import { describe, expect, it } from 'vitest'
import { InfrastructureError, ValidationError } from '../errors/index'

describe('shared errors', () => {
  it('InfrastructureError exposes code', () => {
    const error = new InfrastructureError('TEST_CODE', 'test message')
    expect(error.code).toBe('TEST_CODE')
    expect(error.message).toBe('test message')
    expect(error.name).toBe('InfrastructureError')
  })

  it('ValidationError uses VALIDATION_ERROR code', () => {
    const error = new ValidationError('invalid input')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.name).toBe('ValidationError')
  })
})
