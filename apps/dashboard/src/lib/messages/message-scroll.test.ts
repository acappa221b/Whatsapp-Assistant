import { describe, expect, it } from 'vitest'
import { shouldStickToBottom } from './message-scroll'

describe('shouldStickToBottom', () => {
  it('returns true when near bottom', () => {
    expect(
      shouldStickToBottom({ scrollHeight: 1000, scrollTop: 900, clientHeight: 80 }),
    ).toBe(true)
  })

  it('returns false when scrolled up', () => {
    expect(
      shouldStickToBottom({ scrollHeight: 1000, scrollTop: 100, clientHeight: 80 }),
    ).toBe(false)
  })
})
