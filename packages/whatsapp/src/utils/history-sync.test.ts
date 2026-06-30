import { describe, expect, it, vi } from 'vitest'
import { syncHistoryChats } from './history-sync'

describe('syncHistoryChats', () => {
  it('discovers chats from history payload', async () => {
    const onChatDiscovered = vi.fn().mockResolvedValue(undefined)
    const count = await syncHistoryChats(
      [
        { id: '5511@s.whatsapp.net', name: 'Maiara' },
        { id: '120363@g.us', subject: 'Grupo Teste' },
      ],
      onChatDiscovered,
    )

    expect(count).toBe(2)
    expect(onChatDiscovered).toHaveBeenCalledWith('5511@s.whatsapp.net', 'Maiara')
    expect(onChatDiscovered).toHaveBeenCalledWith('120363@g.us', 'Grupo Teste')
  })

  it('returns zero when chats are missing', async () => {
    const onChatDiscovered = vi.fn()
    expect(await syncHistoryChats(undefined, onChatDiscovered)).toBe(0)
    expect(onChatDiscovered).not.toHaveBeenCalled()
  })
})
