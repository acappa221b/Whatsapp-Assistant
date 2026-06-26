import type { PrismaClient } from '@prisma/client'
import type { WhatsappChatConfigRepository } from '@finance-ai/core/domains/whatsapp-chat-config'
import type { WhatsappChatConfig } from '@finance-ai/core/domains/whatsapp-chat-config'
import { WhatsappChatConfigMapper } from '../mappers/whatsapp-chat-config.mapper'

export class WhatsappChatConfigPrismaRepository implements WhatsappChatConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
