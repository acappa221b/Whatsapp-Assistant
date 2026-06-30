import type { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import type {
  ChatConfigListFilters,
  ChatConfigListResult,
  OrphanChatPreview,
  WhatsappChatConfigRepository,
} from '../domain/whatsapp-chat-config.repository'

export class InMemoryWhatsappChatConfigRepository implements WhatsappChatConfigRepository {
  private store = new Map<string, WhatsappChatConfig>()
  private nextDisplayNumber = 1
  private messageChatIds = new Set<string>()

  setMessageChatIds(chatIds: string[]): void {
    this.messageChatIds = new Set(chatIds)
  }

  async save(config: WhatsappChatConfig): Promise<WhatsappChatConfig> {
    const withDisplayNumber =
      config.displayNumber > 0 ? config : config.withDisplayNumber(this.nextDisplayNumber++)
    this.store.set(withDisplayNumber.chatId, withDisplayNumber)
    return withDisplayNumber
  }

  async findByChatId(chatId: string): Promise<WhatsappChatConfig | null> {
    return this.store.get(chatId.trim()) ?? null
  }

  async findAll(): Promise<WhatsappChatConfig[]> {
    return [...this.store.values()].sort((a, b) => a.chatId.localeCompare(b.chatId))
  }

  async hasMessages(chatId: string): Promise<boolean> {
    return this.messageChatIds.has(chatId.trim())
  }

  async findPaginated(filters: ChatConfigListFilters): Promise<ChatConfigListResult> {
    let items = await this.findAll()
    if (filters.chatType === 'group') {
      items = items.filter((item) => item.chatId.endsWith('@g.us'))
    } else if (filters.chatType === 'direct') {
      items = items.filter((item) => !item.chatId.endsWith('@g.us'))
    }
    if (filters.hasMessages === true) {
      items = items.filter((item) => this.messageChatIds.has(item.chatId))
    } else if (filters.hasMessages === false) {
      items = items.filter((item) => !this.messageChatIds.has(item.chatId))
    }
    const search = filters.search?.trim().toLowerCase()
    if (search) {
      const displayMatch = /^#?(\d+)$/.exec(search)
      items = items.filter((item) => {
        if (displayMatch) return item.displayNumber === Number(displayMatch[1])
        return item.name?.toLowerCase().includes(search) ?? false
      })
    }
    const page = Math.max(1, filters.page)
    const limit = Math.max(1, filters.limit)
    const skip = (page - 1) * limit
    return {
      items: items.slice(skip, skip + limit),
      total: items.length,
      page,
      limit,
    }
  }

  async findOrphanChatIds(includeGroups: boolean): Promise<OrphanChatPreview> {
    const chatIds = [...this.store.keys()].filter((chatId) => {
      if (this.messageChatIds.has(chatId)) return false
      if (!includeGroups && chatId.endsWith('@g.us')) return false
      return true
    })
    return {
      chatIds,
      total: chatIds.length,
      groupCount: chatIds.filter((chatId) => chatId.endsWith('@g.us')).length,
    }
  }

  async deleteByChatIds(chatIds: string[]): Promise<number> {
    let removed = 0
    for (const chatId of chatIds) {
      if (this.store.delete(chatId)) removed += 1
    }
    return removed
  }
}
