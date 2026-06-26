import type { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import type { WhatsappChatConfigRepository } from '../domain/whatsapp-chat-config.repository'

export class InMemoryWhatsappChatConfigRepository implements WhatsappChatConfigRepository {
  private store = new Map<string, WhatsappChatConfig>()
  private nextDisplayNumber = 1

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
}
