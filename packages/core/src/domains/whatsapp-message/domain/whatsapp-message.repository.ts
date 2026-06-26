import type { PaginatedResult, PaginationInput } from '../../../events/index'
import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { ChatArchiveSummary } from '../application/whatsapp-message.use-cases'
import type { WhatsappMessage } from './whatsapp-message.entity'

export type WhatsappMessageListFilters = {
  processed?: boolean
  messageType?: MessageType
  chatId?: string
  fromMe?: boolean
}

export type WhatsappMessageRepository = {
  save(message: WhatsappMessage): Promise<WhatsappMessage>
  findById(id: string): Promise<WhatsappMessage | null>
  findByExternalMessageId(externalMessageId: string): Promise<WhatsappMessage | null>
  findMany(
    filters: WhatsappMessageListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<WhatsappMessage>>
  count(filters?: WhatsappMessageListFilters): Promise<number>
  countByMessageType(): Promise<Record<string, number>>
  countEmptyTextMessages(): Promise<number>
  listChatSummaries(): Promise<ChatArchiveSummary[]>
  backfillMissingNames(input: {
    chatId?: string
    senderId?: string
    chatName?: string | null
    senderName?: string | null
  }): Promise<number>
  getFidelityMetrics(): Promise<import('../application/message-fidelity.use-case').MessageFidelityMetrics>
  listStoragePathsByChatId(chatId: string): Promise<string[]>
  deleteByChatId(chatId: string): Promise<number>
  findRecentByChatId(
    chatId: string,
    options: { limit: number; fromMe?: boolean },
  ): Promise<WhatsappMessage[]>
  findByChatIdInRange(chatId: string, start: Date, end: Date): Promise<WhatsappMessage[]>
  markSourceAgent(id: string): Promise<void>
}
