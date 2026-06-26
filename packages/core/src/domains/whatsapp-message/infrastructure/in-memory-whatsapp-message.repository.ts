import type { PaginatedResult, PaginationInput } from '../../../events/index'
import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { ChatArchiveSummary } from '../application/whatsapp-message.use-cases'
import { WhatsappMessage } from '../domain/whatsapp-message.entity'
import type {
  WhatsappMessageListFilters,
  WhatsappMessageRepository,
} from '../domain/whatsapp-message.repository'

export class InMemoryWhatsappMessageRepository implements WhatsappMessageRepository {
  private store = new Map<string, WhatsappMessage>()

  async save(message: WhatsappMessage): Promise<WhatsappMessage> {
    this.store.set(message.id, message)
    return message
  }

  async findById(id: string): Promise<WhatsappMessage | null> {
    return this.store.get(id) ?? null
  }

  async findByExternalMessageId(externalMessageId: string): Promise<WhatsappMessage | null> {
    for (const message of this.store.values()) {
      if (message.externalMessageId === externalMessageId) return message
    }
    return null
  }

  async findMany(
    filters: WhatsappMessageListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<WhatsappMessage>> {
    let items = [...this.store.values()]
    if (filters.processed !== undefined) {
      items = items.filter((m) => m.processed === filters.processed)
    }
    if (filters.messageType) {
      items = items.filter((m) => m.messageType === filters.messageType)
    }
    if (filters.chatId) {
      items = items.filter((m) => m.chatId === filters.chatId)
    }
    if (filters.fromMe !== undefined) {
      items = items.filter((m) => m.fromMe === filters.fromMe)
    }
    items.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
    const total = items.length
    const start = (pagination.page - 1) * pagination.limit
    return {
      items: items.slice(start, start + pagination.limit),
      total,
      page: pagination.page,
      limit: pagination.limit,
    }
  }

  async count(filters: WhatsappMessageListFilters = {}): Promise<number> {
    const result = await this.findMany(filters, { page: 1, limit: Number.MAX_SAFE_INTEGER })
    return result.total
  }

  async countByMessageType(): Promise<Record<string, number>> {
    const result: Record<string, number> = {}
    for (const message of this.store.values()) {
      result[message.messageType] = (result[message.messageType] ?? 0) + 1
    }
    return result
  }

  async countEmptyTextMessages(): Promise<number> {
    let count = 0
    for (const message of this.store.values()) {
      if (message.messageType === 'TEXT' && !message.content.trim()) count += 1
    }
    return count
  }

  async listChatSummaries(): Promise<ChatArchiveSummary[]> {
    const byChat = new Map<string, WhatsappMessage[]>()
    for (const message of this.store.values()) {
      const list = byChat.get(message.chatId) ?? []
      list.push(message)
      byChat.set(message.chatId, list)
    }

    const summaries: ChatArchiveSummary[] = []
    for (const [chatId, messages] of byChat.entries()) {
      messages.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
      const latest = messages[0]
      if (!latest) continue
      summaries.push({
        chatId,
        displayNumber: 0,
        chatName: latest.chatName,
        messageCount: messages.length,
        lastMessageAt: latest.receivedAt,
        lastMessagePreview: latest.content,
        lastMessageType: latest.messageType,
      })
    }

    summaries.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
    return summaries
  }

  async backfillMissingNames(input: {
    chatId?: string
    senderId?: string
    chatName?: string | null
    senderName?: string | null
  }): Promise<number> {
    let updated = 0
    const chatName = input.chatName?.trim()
    const senderName = input.senderName?.trim()

    for (const message of this.store.values()) {
      let next = message
      let changed = false

      if (input.chatId && chatName && message.chatId === input.chatId && !message.chatName) {
        next = next.enrichFrom({ chatName })
        changed = true
      }
      if (
        input.senderId &&
        senderName &&
        message.senderId === input.senderId &&
        !message.senderName
      ) {
        next = next.enrichFrom({ senderName })
        changed = true
      }
      if (changed) {
        this.store.set(message.id, next)
        updated += 1
      }
    }

    return updated
  }

  async getFidelityMetrics(): Promise<import('../application/message-fidelity.use-case').MessageFidelityMetrics> {
    const genericNames = ['Contato', 'Grupo', 'Conversa']
    let textEmpty = 0
    let extractedTexts = 0
    let imagesTotal = 0
    let imagesWithCaption = 0
    let senderResolved = 0
    const chatIds = new Set<string>()
    const namedChats = new Set<string>()

    for (const message of this.store.values()) {
      chatIds.add(message.chatId)
      if (message.messageType === 'TEXT') {
        if (!message.content.trim() || message.content.trim() === '—') textEmpty += 1
        else extractedTexts += 1
      }
      if (message.messageType === 'IMAGE') {
        imagesTotal += 1
        const content = message.content.trim()
        if (content && content !== '[image]') imagesWithCaption += 1
      }
      if (message.senderName?.trim()) senderResolved += 1
      const chatName = message.chatName?.trim()
      if (
        chatName &&
        !genericNames.includes(chatName) &&
        !chatName.includes('@') &&
        !/^\d{10,}$/.test(chatName)
      ) {
        namedChats.add(message.chatId)
      }
    }

    const totalMessages = this.store.size
    const distinctChats = chatIds.size
    const chatsResolved = namedChats.size
    const imagesWithoutCaption = imagesTotal - imagesWithCaption
    const imagesProcessed = 0
    const imagesWithoutExtraction = imagesTotal
    const senderFallback = Math.max(0, totalMessages - senderResolved)
    const chatsFallback = Math.max(0, distinctChats - chatsResolved)

    return {
      totalMessages,
      extractedTexts,
      textEmpty,
      imagesTotal,
      imagesWithCaption,
      imagesWithoutCaption,
      imagesProcessed,
      imagesWithoutExtraction,
      chatsResolved,
      chatsFallback,
      senderResolved,
      senderFallback,
      textExtractionRate:
        totalMessages === 0 ? 1 : extractedTexts / Math.max(1, extractedTexts + textEmpty),
      contactResolutionRate: distinctChats === 0 ? 1 : chatsResolved / distinctChats,
      imageExtractionRate: imagesTotal === 0 ? 1 : imagesProcessed / imagesTotal,
    }
  }

  async listStoragePathsByChatId(chatId: string): Promise<string[]> {
    const paths: string[] = []
    for (const message of this.store.values()) {
      if (message.chatId === chatId && message.storagePath?.trim()) {
        paths.push(message.storagePath.trim())
      }
    }
    return paths
  }

  async deleteByChatId(chatId: string): Promise<number> {
    let deleted = 0
    for (const [id, message] of this.store.entries()) {
      if (message.chatId === chatId) {
        this.store.delete(id)
        deleted += 1
      }
    }
    return deleted
  }

  async findRecentByChatId(
    chatId: string,
    options: { limit: number; fromMe?: boolean },
  ): Promise<WhatsappMessage[]> {
    let items = [...this.store.values()].filter((m) => m.chatId === chatId)
    if (options.fromMe !== undefined) {
      items = items.filter((m) => m.fromMe === options.fromMe)
    }
    items.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
    return items.slice(0, options.limit)
  }

  async findByChatIdInRange(chatId: string, start: Date, end: Date): Promise<WhatsappMessage[]> {
    return [...this.store.values()]
      .filter(
        (m) =>
          m.chatId === chatId &&
          m.receivedAt.getTime() >= start.getTime() &&
          m.receivedAt.getTime() <= end.getTime(),
      )
      .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())
  }

  async markSourceAgent(id: string): Promise<void> {
    const message = this.store.get(id)
    if (message) {
      this.store.set(id, message.markSourceAgent())
    }
  }
}
