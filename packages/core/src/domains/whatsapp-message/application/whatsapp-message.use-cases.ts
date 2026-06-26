import { NotFoundError } from '../../../domain/errors'
import { isMoreInformativeName } from '@finance-ai/shared/utils'
import { DomainEvents, type EventBus, type PaginatedResult, type PaginationInput } from '../../../events/index'
import { generateId } from '../../../domain/utils'
import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import { WhatsappMessage } from '../domain/whatsapp-message.entity'
import type {
  WhatsappMessageListFilters,
  WhatsappMessageRepository,
} from '../domain/whatsapp-message.repository'

export type StoreWhatsappMessageInput = {
  externalMessageId: string
  chatId: string
  chatName?: string | null
  sender: string
  senderId: string
  senderName?: string | null
  content: string
  messageType: MessageType
  rawPayload: Record<string, unknown>
  mediaUrl?: string | null
  mimeType?: string | null
  fileName?: string | null
  fileSize?: number | null
  storagePath?: string | null
  fromMe?: boolean
  receivedAt: Date
}

export class StoreWhatsappMessageUseCase {
  constructor(
    private readonly repository: WhatsappMessageRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: StoreWhatsappMessageInput): Promise<WhatsappMessage> {
    const existing = await this.repository.findByExternalMessageId(input.externalMessageId)
    if (existing) {
      const shouldEnrichContent = !existing.content.trim() && input.content.trim()
      const shouldEnrichSender =
        input.senderName && isMoreInformativeName(input.senderName, existing.senderName)
      const shouldEnrichChat =
        input.chatName && isMoreInformativeName(input.chatName, existing.chatName)
      const shouldEnrich =
        shouldEnrichContent ||
        shouldEnrichSender ||
        shouldEnrichChat ||
        (input.messageType !== existing.messageType && input.content.trim())
      if (shouldEnrich) {
        const enriched = existing.enrichFrom({
          content: input.content,
          messageType: input.messageType,
          senderName: shouldEnrichSender ? input.senderName : undefined,
          chatName: shouldEnrichChat ? input.chatName : undefined,
          rawPayload: input.rawPayload,
        })
        return this.repository.save(enriched)
      }
      return existing
    }

    const message = WhatsappMessage.create({
      id: generateId(),
      externalMessageId: input.externalMessageId,
      chatId: input.chatId,
      chatName: input.chatName,
      sender: input.sender,
      senderId: input.senderId,
      senderName: input.senderName,
      content: input.content,
      messageType: input.messageType,
      rawPayload: input.rawPayload,
      mediaUrl: input.mediaUrl,
      mimeType: input.mimeType,
      fileName: input.fileName,
      fileSize: input.fileSize,
      storagePath: input.storagePath,
      fromMe: input.fromMe,
      receivedAt: input.receivedAt,
    })
    const saved = await this.repository.save(message)
    await this.eventBus.publish({
      name: DomainEvents.WhatsappMessagePersisted,
      payload: {
        messageId: saved.id,
        externalMessageId: saved.externalMessageId,
        messageType: saved.messageType,
        chatId: saved.chatId,
        fromMe: saved.fromMe,
        content: saved.content,
      },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class GetWhatsappMessageUseCase {
  constructor(private readonly repository: WhatsappMessageRepository) {}

  async execute(id: string): Promise<WhatsappMessage> {
    const message = await this.repository.findById(id)
    if (!message) throw new NotFoundError('WhatsappMessage', id)
    return message
  }
}

export class ListWhatsappMessagesUseCase {
  constructor(private readonly repository: WhatsappMessageRepository) {}

  async execute(
    filters: WhatsappMessageListFilters = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<PaginatedResult<WhatsappMessage>> {
    return this.repository.findMany(filters, pagination)
  }
}

export class MarkWhatsappMessageProcessedUseCase {
  constructor(
    private readonly repository: WhatsappMessageRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string): Promise<WhatsappMessage> {
    const existing = await this.repository.findById(id)
    if (!existing) throw new NotFoundError('WhatsappMessage', id)
    const updated = existing.markProcessed()
    const saved = await this.repository.save(updated)
    await this.eventBus.publish({
      name: DomainEvents.WhatsappMessageProcessed,
      payload: { messageId: saved.id, externalMessageId: saved.externalMessageId },
      occurredAt: new Date(),
    })
    return saved
  }
}

export type ChatArchiveSummary = {
  chatId: string
  displayNumber: number
  chatName: string | null
  messageCount: number
  lastMessageAt: Date
  lastMessagePreview: string
  lastMessageType: MessageType
}

export class ListWhatsappChatArchiveUseCase {
  constructor(private readonly repository: WhatsappMessageRepository) {}

  async execute(): Promise<ChatArchiveSummary[]> {
    return this.repository.listChatSummaries()
  }
}

export class GetMessageArchiveMetricsUseCase {
  constructor(private readonly repository: WhatsappMessageRepository) {}

  async execute(): Promise<{
    persistedByType: Record<string, number>
    emptyTextCount: number
    totalPersisted: number
  }> {
    const [persistedByType, emptyTextCount, totalPersisted] = await Promise.all([
      this.repository.countByMessageType(),
      this.repository.countEmptyTextMessages(),
      this.repository.count(),
    ])
    return { persistedByType, emptyTextCount, totalPersisted }
  }
}
