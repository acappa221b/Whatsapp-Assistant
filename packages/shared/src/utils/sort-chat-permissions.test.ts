import { describe, expect, it } from 'vitest'
import { sortChats, type SortableChatRow } from './sort-chat-permissions'

const rows: SortableChatRow[] = [
  {
    chatId: 'a@g.us',
    displayNumber: 3,
    name: 'Zé Grupo',
    archiveEnabled: false,
    agentChatEnabled: true,
    audioProcessingEnabled: false,
    photoProcessingEnabled: true,
    reportGenerationEnabled: false,
  },
  {
    chatId: 'b@lid',
    displayNumber: 1,
    name: 'Ana',
    archiveEnabled: true,
    agentChatEnabled: false,
    audioProcessingEnabled: true,
    photoProcessingEnabled: false,
    reportGenerationEnabled: true,
  },
  {
    chatId: 'c@lid',
    displayNumber: 2,
    name: 'Bruno',
    archiveEnabled: true,
    agentChatEnabled: true,
    audioProcessingEnabled: false,
    photoProcessingEnabled: false,
    reportGenerationEnabled: false,
  },
]

describe('sortChats', () => {
  it('sorts by displayNumber numerically (#1, #2, #10, #100)', () => {
    const numericRows: SortableChatRow[] = [
      { ...rows[0]!, displayNumber: 10, name: 'Alice' },
      { ...rows[1]!, displayNumber: 2, name: 'Bruno' },
      { ...rows[2]!, displayNumber: 100, name: 'Carlos' },
      { ...rows[1]!, chatId: 'd@lid', displayNumber: 1, name: 'Diana' },
    ]
    const sorted = sortChats(numericRows, { column: 'name', direction: 'asc' })
    expect(sorted.map((r) => r.displayNumber)).toEqual([1, 2, 10, 100])
  })

  it('sorts names descending', () => {
    const sorted = sortChats(rows, { column: 'name', direction: 'desc' })
    expect(sorted.map((r) => r.displayNumber)).toEqual([3, 2, 1])
  })

  it('sorts booleans with enabled first on desc', () => {
    const sorted = sortChats(rows, { column: 'archiveEnabled', direction: 'desc' })
    expect(sorted[0]?.archiveEnabled).toBe(true)
    expect(sorted.at(-1)?.archiveEnabled).toBe(false)
  })

  it('returns original order when sort cleared', () => {
    expect(sortChats(rows, { column: null, direction: null })).toEqual(rows)
  })
})
