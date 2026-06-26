import { describe, expect, it } from 'vitest'
import { formatChatDisplayId, formatChatListLabel } from './chat-display-id'

describe('chat display id helpers', () => {
  it('formats display id', () => {
    expect(formatChatDisplayId(3)).toBe('#3')
  })

  it('formats list label with and without name', () => {
    expect(formatChatListLabel(3, 'Ferramentaria')).toBe('#3 Ferramentaria')
    expect(formatChatListLabel(7, null)).toBe('#7 (sem nome)')
    expect(formatChatListLabel(7, '   ')).toBe('#7 (sem nome)')
  })
})
