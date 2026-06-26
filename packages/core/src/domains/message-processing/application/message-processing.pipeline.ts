import type { EventBus } from '../../../events/index'
import { DomainEvents } from '../../../events/index'
import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import { generateId } from '../../../domain/utils'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { EnqueueMessageUseCase } from './message-processing.use-cases'
import type { ProcessMessageUseCase } from './message-processing.use-cases'
import type { SkipMessageProcessingUseCase } from './message-processing.use-cases'

type WhatsappMessagePersistedPayload = {
  messageId: string
  externalMessageId: string
  messageType: MessageType
}

export class MessageProcessingPipeline {
  constructor(
    private readonly eventBus: EventBus,
    private readonly whatsappRepository: WhatsappMessageRepository,
    private readonly chatConfigRepository: WhatsappChatConfigRepository,
    private readonly enqueueUseCase: EnqueueMessageUseCase,
    private readonly processMessageUseCase: ProcessMessageUseCase,
    private readonly skipMessageUseCase: SkipMessageProcessingUseCase,
  ) {}

  register(): () => void {
    return this.eventBus.subscribe(DomainEvents.WhatsappMessagePersisted, async (event) => {
      const payload = event.payload as WhatsappMessagePersistedPayload
      const message = await this.whatsappRepository.findById(payload.messageId)
      if (!message) return

      const chatConfig = await this.chatConfigRepository.findByChatId(message.chatId)
      if (!chatConfig?.archiveEnabled) {
        await this.skipMessageUseCase.execute(
          payload.messageId,
          payload.messageType,
          'Archive disabled for chat',
        )
        return
      }

      await this.enqueueUseCase.execute(payload.messageId, payload.messageType)
      await this.processMessageUseCase.execute(payload.messageId)
    })
  }
}
