import { describe, expect, it } from 'vitest'
import { ok, err, isDefined, assertNever } from '../utils/index'

describe('shared utils', () => {
  it('ok returns success result', () => {
    expect(ok(42)).toEqual({ success: true, value: 42 })
  })

  it('err returns failure result', () => {
    expect(err('fail')).toEqual({ success: false, error: 'fail' })
  })

  it('isDefined filters nullish values', () => {
    expect(isDefined(null)).toBe(false)
    expect(isDefined(undefined)).toBe(false)
    expect(isDefined('x')).toBe(true)
  })

  it('assertNever throws for unexpected values', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(/Unexpected value/)
  })
})
