import type { EventBus } from '../../../events/index'
import { DomainEvents } from '../../../events/index'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { WhatsappMessageRepository } from '../domain/whatsapp-message.repository'

export type DeleteChatHistoryResult = {
  deletedMessages: number
  deletedMediaFiles: number
}

export type ChatMediaCleanup = {
  deleteFile(storagePath: string): Promise<boolean>
  deleteChatDirectory(input: {
    chatId: string
    displayName: string | null
    storageDir: string | null
  }): Promise<{ deletedFiles: number }>
}

export class DeleteChatHistoryUseCase {
  constructor(
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly chatConfigRepository: WhatsappChatConfigRepository,
    private readonly mediaCleanup: ChatMediaCleanup,
    private readonly eventBus?: EventBus,
  ) {}

  async execute(chatId: string): Promise<DeleteChatHistoryResult> {
    const trimmed = chatId.trim()
    const config = await this.chatConfigRepository.findByChatId(trimmed)

    const storagePaths = await this.messageRepository.listStoragePathsByChatId(trimmed)
    let deletedMediaFiles = 0
    for (const storagePath of storagePaths) {
      const deleted = await this.mediaCleanup.deleteFile(storagePath)
      if (deleted) deletedMediaFiles += 1
    }

    const directoryResult = await this.mediaCleanup.deleteChatDirectory({
      chatId: trimmed,
      displayName: config?.name ?? null,
      storageDir: config?.storageDir ?? null,
    })
    deletedMediaFiles += directoryResult.deletedFiles

    const deletedMessages = await this.messageRepository.deleteByChatId(trimmed)

    if (config) {
      await this.chatConfigRepository.save(
        config.update({
          archiveEnabled: false,
          agentChatEnabled: false,
          photoProcessingEnabled: false,
          audioProcessingEnabled: false,
          reportGenerationEnabled: false,
          storageDir: null,
        }),
      )
    }

    if (this.eventBus) {
      await this.eventBus.publish({
        name: DomainEvents.WhatsappChatHistoryDeleted,
        payload: { chatId: trimmed, deletedMessages, deletedMediaFiles },
        occurredAt: new Date(),
      })
    }

    return { deletedMessages, deletedMediaFiles }
  }
}
