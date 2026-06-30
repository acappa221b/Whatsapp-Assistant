import { describe, expect, it, vi } from 'vitest'
import {
  collectMessageChatIds,
  syncHistoryChats,
  syncHistoryChatsFromMessages,
} from './history-sync'

describe('history-sync RC-22A', () => {
  it('syncHistoryChats skips when disabled', async () => {
    const onChatDiscovered = vi.fn()
    const count = await syncHistoryChats(
      [{ id: '5511@s.whatsapp.net', name: 'Ana' }],
      onChatDiscovered,
      { enabled: false },
    )
    expect(count).toBe(0)
    expect(onChatDiscovered).not.toHaveBeenCalled()
  })

  it('syncHistoryChatsFromMessages only discovers chats with messages', async () => {
    const onChatDiscovered = vi.fn().mockResolvedValue(undefined)
    const ids = collectMessageChatIds([
      { key: { remoteJid: '5511@s.whatsapp.net' } },
      { key: { remoteJid: '120363@g.us' } },
    ])
    const count = await syncHistoryChatsFromMessages(
      [
        { id: '5511@s.whatsapp.net', name: 'Ana' },
        { id: '120363@g.us', subject: 'Grupo' },
        { id: '5599@s.whatsapp.net', name: 'Orfao' },
      ],
      ids,
      onChatDiscovered,
    )
    expect(count).toBe(2)
    expect(onChatDiscovered).toHaveBeenCalledWith('5511@s.whatsapp.net', 'Ana')
    expect(onChatDiscovered).toHaveBeenCalledWith('120363@g.us', 'Grupo')
    expect(onChatDiscovered).not.toHaveBeenCalledWith('5599@s.whatsapp.net', expect.anything())
  })
})
