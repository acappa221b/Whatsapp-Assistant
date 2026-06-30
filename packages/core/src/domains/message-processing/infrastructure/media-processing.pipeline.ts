import type { EventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'

type PersistedPayload = {
  messageId: string
  chatId: string
  messageType: string
  fromMe: boolean
}

export class MediaProcessingPipeline {
  constructor(
    private readonly eventBus: EventBus,
    private readonly chatConfigRepository: WhatsappChatConfigRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly onPhotoProcessing?: (messageId: string, chatId: string) => Promise<void>,
    private readonly onAudioProcessing?: (messageId: string, chatId: string) => Promise<void>,
  ) {}

  register(): () => void {
    return this.eventBus.subscribe(DomainEvents.WhatsappMessagePersisted, async (event) => {
      const payload = event.payload as PersistedPayload
      if (payload.fromMe) return

      const config = await this.chatConfigRepository.findByChatId(payload.chatId)
      if (!config?.archiveEnabled) return

      const message = await this.messageRepository.findById(payload.messageId)
      if (!message) return

      if (message.messageType === 'IMAGE' && config.photoProcessingEnabled) {
        console.info('[MediaProcessing] photo queued', {
          chatId: payload.chatId,
          messageId: payload.messageId,
        })
        await this.onPhotoProcessing?.(payload.messageId, payload.chatId)
      }

      if (message.messageType === 'AUDIO' && config.audioProcessingEnabled) {
        console.info('[MediaProcessing] audio queued', {
          chatId: payload.chatId,
          messageId: payload.messageId,
        })
        void this.onAudioProcessing?.(payload.messageId, payload.chatId).catch((error) => {
          console.error('[MediaProcessing] audio failed', {
            messageId: payload.messageId,
            error: error instanceof Error ? error.message : String(error),
          })
        })
      }
    })
  }
}
