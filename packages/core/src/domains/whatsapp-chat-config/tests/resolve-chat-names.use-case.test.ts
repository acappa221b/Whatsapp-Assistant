import { describe, expect, it, vi } from 'vitest'
import { ResolveChatNamesUseCase } from '../application/resolve-chat-names.use-case'
import { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import { InMemoryWhatsappChatConfigRepository } from '../infrastructure/in-memory-whatsapp-chat-config.repository'

describe('ResolveChatNamesUseCase', () => {
  it('resolves group names via port and persists', async () => {
    const repository = new InMemoryWhatsappChatConfigRepository()
    await repository.save(WhatsappChatConfig.create({ chatId: '120363421372276062@g.us' }))

    const useCase = new ResolveChatNamesUseCase(repository, {
      resolve: vi.fn(async (chatId) => ({
        chatId,
        name: 'Financeiro Unique',
        source: 'groupMetadata',
      })),
    })

    const result = await useCase.execute()
    expect(result.resolved).toBe(1)
    const saved = await repository.findByChatId('120363421372276062@g.us')
    expect(saved?.name).toBe('Financeiro Unique')
  })
})
