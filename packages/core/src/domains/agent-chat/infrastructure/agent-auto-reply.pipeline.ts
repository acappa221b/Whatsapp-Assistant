import type { EventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import { isLegacyAgentOutboundMessage } from '@finance-ai/shared/utils'
import { WhatsappMessage } from '../../whatsapp-message/domain/whatsapp-message.entity'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { AgentOutboundTracker } from '../application/agent-outbound-tracker'
import { HandleHumanTakeoverUseCase } from '../application/handle-human-takeover.use-case'
import { ProcessAgentAutoReplyUseCase } from '../application/process-agent-auto-reply.use-case'

type WhatsappMessagePersistedPayload = {
  messageId: string
  externalMessageId: string
  messageType: string
  chatId: string
  fromMe: boolean
  content: string
}

type MediaCompletedPayload = {
  messageId: string
  chatId: string
  content: string
}

export class AgentAutoReplyPipeline {
  constructor(
    private readonly eventBus: EventBus,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly humanTakeover: HandleHumanTakeoverUseCase,
    private readonly processAgentAutoReply: ProcessAgentAutoReplyUseCase,
    private readonly agentOutboundTracker: AgentOutboundTracker,
  ) {}

  register(): () => void {
    const unsubPersisted = this.eventBus.subscribe(
      DomainEvents.WhatsappMessagePersisted,
      async (event) => {
        const payload = event.payload as WhatsappMessagePersistedPayload
        const message = await this.messageRepository.findById(payload.messageId)
        if (!message) return

        if (message.fromMe) {
          const isAgent =
            isLegacyAgentOutboundMessage(message.content) ||
            this.agentOutboundTracker.isAgentEcho(message.chatId, message.content)
          if (isAgent) {
            await this.messageRepository.markSourceAgent(message.id)
          } else {
            await this.humanTakeover.execute(message.chatId)
          }
          return
        }

        await this.processAgentAutoReply.execute(message)
      },
    )

    const onMediaCompleted = async (payload: MediaCompletedPayload) => {
      const message = await this.messageRepository.findById(payload.messageId)
      if (!message || message.fromMe) return
      const content =
        payload.content?.trim() && message.content.trim() !== payload.content.trim()
          ? payload.content.trim()
          : message.content
      const enriched =
        content !== message.content
          ? WhatsappMessage.reconstitute({
              id: message.id,
              externalMessageId: message.externalMessageId,
              chatId: message.chatId,
              chatName: message.chatName,
              sender: message.sender,
              senderId: message.senderId,
              senderName: message.senderName,
              content,
              messageType: message.messageType,
              rawPayload: message.rawPayload,
              mediaUrl: message.mediaUrl,
              mimeType: message.mimeType,
              fileName: message.fileName,
              fileSize: message.fileSize,
              storagePath: message.storagePath,
              fromMe: message.fromMe,
              sourceAgent: message.sourceAgent,
              processed: message.processed,
              receivedAt: message.receivedAt,
              createdAt: message.createdAt,
            })
          : message
      await this.processAgentAutoReply.execute(enriched)
    }

    const unsubTranscription = this.eventBus.subscribe(
      DomainEvents.TranscriptionCompleted,
      async (event) => onMediaCompleted(event.payload as MediaCompletedPayload),
    )

    const unsubPhoto = this.eventBus.subscribe(
      DomainEvents.PhotoProcessingCompleted,
      async (event) => onMediaCompleted(event.payload as MediaCompletedPayload),
    )

    return () => {
      unsubPersisted()
      unsubTranscription()
      unsubPhoto()
    }
  }
}
