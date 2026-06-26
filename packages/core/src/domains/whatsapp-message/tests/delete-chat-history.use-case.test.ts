import { describe, expect, it, vi } from 'vitest'
import { WhatsappChatConfig } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.entity'
import { InMemoryWhatsappChatConfigRepository } from '../../whatsapp-chat-config/infrastructure/in-memory-whatsapp-chat-config.repository'
import { WhatsappMessage } from '../domain/whatsapp-message.entity'
import { DeleteChatHistoryUseCase } from '../application/delete-chat-history.use-case'
import { InMemoryWhatsappMessageRepository } from '../infrastructure/in-memory-whatsapp-message.repository'
import { InMemoryEventBus } from '../../../events/index'
import { DomainEvents } from '../../../events/index'

const now = new Date('2025-06-01T10:00:00Z')
const chatId = '120363421372276062@g.us'

function createMessage(id: string, storagePath?: string) {
  let message = WhatsappMessage.create({
    id,
    externalMessageId: `ext-${id}`,
    chatId,
    sender: '5511@s.whatsapp.net',
    senderId: '5511@s.whatsapp.net',
    content: 'Hello',
    messageType: 'TEXT',
    rawPayload: {},
    receivedAt: now,
    now,
  })
  if (storagePath) {
    message = message.withStoredMedia({
      mimeType: 'image/jpeg',
      fileName: 'file.jpg',
      fileSize: 100,
      storagePath,
    })
  }
  return message
}

describe('DeleteChatHistoryUseCase', () => {
  it('deletes messages, media files, and disables chat flags', async () => {
    const messageRepository = new InMemoryWhatsappMessageRepository()
    const chatConfigRepository = new InMemoryWhatsappChatConfigRepository()
    const deleteMediaFile = vi.fn(async () => true)
    const deleteChatDirectory = vi.fn(async () => ({ deletedFiles: 0 }))
    const eventBus = new InMemoryEventBus()
    const published: string[] = []
    eventBus.subscribe(DomainEvents.WhatsappChatHistoryDeleted, (event) => {
      published.push(event.name)
    })

    await chatConfigRepository.save(
      WhatsappChatConfig.create({
        chatId,
        archiveEnabled: true,
        photoProcessingEnabled: true,
        agentChatEnabled: true,
      }),
    )
    await messageRepository.save(createMessage('wa-1'))
    await messageRepository.save(createMessage('wa-2', 'media/a.jpg'))

    const useCase = new DeleteChatHistoryUseCase(
      messageRepository,
      chatConfigRepository,
      { deleteFile: deleteMediaFile, deleteChatDirectory },
      eventBus,
    )

    const result = await useCase.execute(chatId)

    expect(result.deletedMessages).toBe(2)
    expect(result.deletedMediaFiles).toBe(1)
    expect(deleteMediaFile).toHaveBeenCalledWith('media/a.jpg')
    expect(await messageRepository.count()).toBe(0)

    const config = await chatConfigRepository.findByChatId(chatId)
    expect(config?.archiveEnabled).toBe(false)
    expect(config?.agentChatEnabled).toBe(false)
    expect(config?.photoProcessingEnabled).toBe(false)
    expect(published).toContain(DomainEvents.WhatsappChatHistoryDeleted)
  })
})
