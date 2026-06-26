import type { WhatsappChatConfig } from './whatsapp-chat-config.entity'

export type WhatsappChatConfigRepository = {
  save(config: WhatsappChatConfig): Promise<WhatsappChatConfig>
  findByChatId(chatId: string): Promise<WhatsappChatConfig | null>
  findAll(): Promise<WhatsappChatConfig[]>
}
