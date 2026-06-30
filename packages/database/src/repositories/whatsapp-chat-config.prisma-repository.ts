import type { PrismaClient } from '@prisma/client'
import type {
  ChatConfigListFilters,
  ChatConfigListResult,
  OrphanChatPreview,
  WhatsappChatConfigRepository,
} from '@finance-ai/core/domains/whatsapp-chat-config'
import type { WhatsappChatConfig } from '@finance-ai/core/domains/whatsapp-chat-config'
import { WhatsappChatConfigMapper } from '../mappers/whatsapp-chat-config.mapper'

export class WhatsappChatConfigPrismaRepository implements WhatsappChatConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async getChatIdsWithMessages(): Promise<Set<string>> {
    const rows = await this.prisma.whatsappMessage.findMany({
      distinct: ['chatId'],
      select: { chatId: true },
    })
    return new Set(rows.map((row) => row.chatId))
  }

  async hasMessages(chatId: string): Promise<boolean> {
    const row = await this.prisma.whatsappMessage.findFirst({
      where: { chatId: chatId.trim() },
      select: { id: true },
    })
    return Boolean(row)
  }

  async findPaginated(filters: ChatConfigListFilters): Promise<ChatConfigListResult> {
    const page = Math.max(1, filters.page)
    const limit = Math.min(200, Math.max(1, filters.limit))
    const skip = (page - 1) * limit
    const messageChatIds =
      filters.hasMessages === undefined ? null : await this.getChatIdsWithMessages()

    const and: Array<Record<string, unknown>> = []

    if (filters.chatType === 'group') {
      and.push({ chatId: { endsWith: '@g.us' } })
    } else if (filters.chatType === 'direct') {
      and.push({ NOT: { chatId: { endsWith: '@g.us' } } })
    }

    if (filters.hasMessages === true && messageChatIds) {
      and.push({ chatId: { in: [...messageChatIds] } })
    } else if (filters.hasMessages === false && messageChatIds) {
      and.push({ chatId: { notIn: [...messageChatIds] } })
    }

    const search = filters.search?.trim()
    const where: Record<string, unknown> = and.length > 0 ? { AND: and } : {}
    if (search) {
      const displayMatch = /^#?(\d+)$/.exec(search)
      if (displayMatch) {
        where.OR = [{ displayNumber: Number(displayMatch[1]) }]
      } else {
        where.OR = [{ name: { contains: search } }]
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.whatsappChatConfig.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.whatsappChatConfig.count({ where }),
    ])

    return {
      items: records.map(WhatsappChatConfigMapper.toDomain),
      total,
      page,
      limit,
    }
  }

  async findOrphanChatIds(includeGroups: boolean): Promise<OrphanChatPreview> {
    const [configs, messageChatIds] = await Promise.all([
      this.prisma.whatsappChatConfig.findMany({ select: { chatId: true } }),
      this.getChatIdsWithMessages(),
    ])

    const chatIds = configs
      .map((row) => row.chatId)
      .filter((chatId) => {
        if (messageChatIds.has(chatId)) return false
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
    if (chatIds.length === 0) return 0
    const result = await this.prisma.whatsappChatConfig.deleteMany({
      where: { chatId: { in: chatIds } },
    })
    return result.count
  }

  async save(config: WhatsappChatConfig): Promise<WhatsappChatConfig> {
    const data = WhatsappChatConfigMapper.toPersistence(config)
    const existing = await this.prisma.whatsappChatConfig.findUnique({
      where: { chatId: config.chatId },
    })

    if (existing) {
      const saved = await this.prisma.whatsappChatConfig.update({
        where: { chatId: config.chatId },
        data: {
          name: data.name,
          storageDir: data.storageDir,
          archiveEnabled: data.archiveEnabled,
          aiProcessingEnabled: data.aiProcessingEnabled,
          agentChatEnabled: data.agentChatEnabled,
          photoProcessingEnabled: data.photoProcessingEnabled,
          audioProcessingEnabled: data.audioProcessingEnabled,
          reportGenerationEnabled: data.reportGenerationEnabled,
          agentPaused: data.agentPaused,
          agentPausedReason: data.agentPausedReason,
          agentPausedAt: data.agentPausedAt,
        },
      })
      return WhatsappChatConfigMapper.toDomain(saved)
    }

    let displayNumber = config.displayNumber
    if (!displayNumber || displayNumber <= 0) {
      const aggregate = await this.prisma.whatsappChatConfig.aggregate({
        _max: { displayNumber: true },
      })
      displayNumber = (aggregate._max.displayNumber ?? 0) + 1
    }

    const saved = await this.prisma.whatsappChatConfig.create({
      data: {
        chatId: data.chatId,
        displayNumber,
        name: data.name,
        storageDir: data.storageDir,
        archiveEnabled: data.archiveEnabled,
        aiProcessingEnabled: data.aiProcessingEnabled,
        agentChatEnabled: data.agentChatEnabled,
        photoProcessingEnabled: data.photoProcessingEnabled,
        audioProcessingEnabled: data.audioProcessingEnabled,
        reportGenerationEnabled: data.reportGenerationEnabled,
        agentPaused: data.agentPaused,
        agentPausedReason: data.agentPausedReason,
        agentPausedAt: data.agentPausedAt,
      },
    })
    return WhatsappChatConfigMapper.toDomain(saved)
  }

  async findByChatId(chatId: string): Promise<WhatsappChatConfig | null> {
    const record = await this.prisma.whatsappChatConfig.findUnique({
      where: { chatId: chatId.trim() },
    })
    return record ? WhatsappChatConfigMapper.toDomain(record) : null
  }

  async findAll(): Promise<WhatsappChatConfig[]> {
    const records = await this.prisma.whatsappChatConfig.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return records.map(WhatsappChatConfigMapper.toDomain)
  }
}
