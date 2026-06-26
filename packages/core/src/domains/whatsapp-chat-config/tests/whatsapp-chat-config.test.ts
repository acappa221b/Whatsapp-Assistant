import { describe, expect, it } from 'vitest'
import { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import {
  EnsureWhatsappChatDiscoveredUseCase,
  ListWhatsappChatConfigsUseCase,
  UpdateWhatsappChatConfigUseCase,
} from '../application/whatsapp-chat-config.use-cases'
import { InMemoryWhatsappChatConfigRepository } from '../infrastructure/in-memory-whatsapp-chat-config.repository'

describe('WhatsappChatConfig domain', () => {
  it('creates config with features disabled by default', () => {
    const config = WhatsappChatConfig.create({ chatId: '120363421372276062@g.us' })
    expect(config.archiveEnabled).toBe(false)
    expect(config.agentChatEnabled).toBe(false)
    expect(config.photoProcessingEnabled).toBe(false)
  })

  it('EnsureWhatsappChatDiscovered creates once and reuses', async () => {
    const repository = new InMemoryWhatsappChatConfigRepository()
    const useCase = new EnsureWhatsappChatDiscoveredUseCase(repository)

    const first = await useCase.execute('120363421372276062@g.us', 'Financeiro UNIQUE')
    const second = await useCase.execute('120363421372276062@g.us')

    expect(first.chatId).toBe('120363421372276062@g.us')
    expect(first.name).toBe('Financeiro UNIQUE')
    expect(second.chatId).toBe(first.chatId)
    expect((await new ListWhatsappChatConfigsUseCase(repository).execute()).length).toBe(1)
  })

  it('UpdateWhatsappChatConfig toggles photo processing when archive enabled', async () => {
    const repository = new InMemoryWhatsappChatConfigRepository()
    await repository.save(
      WhatsappChatConfig.create({
        chatId: '120363421372276062@g.us',
        archiveEnabled: true,
      }),
    )

    const updated = await new UpdateWhatsappChatConfigUseCase(repository).execute(
      '120363421372276062@g.us',
      { photoProcessingEnabled: true },
    )

    expect(updated.photoProcessingEnabled).toBe(true)
  })
})
