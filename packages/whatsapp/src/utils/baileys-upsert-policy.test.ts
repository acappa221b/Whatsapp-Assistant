import { describe, expect, it } from 'vitest'
import { shouldProcessMessageUpsert } from './baileys-upsert-policy'

describe('shouldProcessMessageUpsert', () => {
  it('processes notify always', () => {
    expect(shouldProcessMessageUpsert('notify', false)).toBe(true)
    expect(shouldProcessMessageUpsert('notify', true)).toBe(true)
  })

  it('ignores append when history import is off', () => {
    expect(shouldProcessMessageUpsert('append', false)).toBe(false)
  })

  it('processes append when history import is on', () => {
    expect(shouldProcessMessageUpsert('append', true)).toBe(true)
  })

  it('processes unknown types as live traffic', () => {
    expect(shouldProcessMessageUpsert(undefined, false)).toBe(true)
  })
})
