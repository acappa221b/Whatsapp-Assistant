import type { WhatsappChatConfig } from './whatsapp-chat-config.entity'

export type ChatConfigListFilters = {
  page: number
  limit: number
  hasMessages?: boolean
  chatType?: 'all' | 'group' | 'direct'
  search?: string
}

export type ChatConfigListResult = {
  items: WhatsappChatConfig[]
  total: number
  page: number
  limit: number
}

export type OrphanChatPreview = {
  chatIds: string[]
  total: number
  groupCount: number
}

export type WhatsappChatConfigRepository = {
  save(config: WhatsappChatConfig): Promise<WhatsappChatConfig>
  findByChatId(chatId: string): Promise<WhatsappChatConfig | null>
  findAll(): Promise<WhatsappChatConfig[]>
  findPaginated(filters: ChatConfigListFilters): Promise<ChatConfigListResult>
  findOrphanChatIds(includeGroups: boolean): Promise<OrphanChatPreview>
  deleteByChatIds(chatIds: string[]): Promise<number>
  hasMessages(chatId: string): Promise<boolean>
}
