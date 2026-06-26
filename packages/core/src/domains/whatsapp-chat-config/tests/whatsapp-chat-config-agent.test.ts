import { describe, expect, it, vi } from 'vitest'
import { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import { InMemoryWhatsappChatConfigRepository } from '../infrastructure/in-memory-whatsapp-chat-config.repository'
import { UpdateWhatsappChatConfigUseCase } from '../application/whatsapp-chat-config.use-cases'

describe('WhatsappChatConfig agent pause (RC-10)', () => {
  it('resets agentPaused when enabling agentChatEnabled', async () => {
    const repository = new InMemoryWhatsappChatConfigRepository()
    await repository.save(
      WhatsappChatConfig.create({
        chatId: '5511@s.whatsapp.net',
        archiveEnabled: true,
        agentChatEnabled: true,
        agentPaused: true,
        agentPausedReason: 'deferral',
        agentPausedAt: new Date(),
      }),
    )

    const updated = await new UpdateWhatsappChatConfigUseCase(repository).execute(
      '5511@s.whatsapp.net',
      { agentChatEnabled: true },
    )

    expect(updated.agentChatEnabled).toBe(true)
    expect(updated.agentPaused).toBe(false)
    expect(updated.agentPausedReason).toBeNull()
    expect(updated.agentPausedAt).toBeNull()
  })

  it('applyHumanTakeover disables agent and pauses', () => {
    const config = WhatsappChatConfig.create({
      chatId: '5511@s.whatsapp.net',
      archiveEnabled: true,
      agentChatEnabled: true,
    })
    const taken = config.applyHumanTakeover(new Date('2025-06-25T12:00:00Z'))
    expect(taken.agentChatEnabled).toBe(false)
    expect(taken.agentPaused).toBe(true)
    expect(taken.agentPausedReason).toBe('human_takeover')
  })
})
