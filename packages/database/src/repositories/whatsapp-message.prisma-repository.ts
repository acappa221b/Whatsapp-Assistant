import type { PrismaClient } from '@prisma/client'
import type { PaginatedResult, PaginationInput } from '@finance-ai/core/events'
import type {
  WhatsappMessageListFilters,
  WhatsappMessageRepository,
} from '@finance-ai/core/domains/whatsapp-message'
import type { WhatsappMessage } from '@finance-ai/core/domains/whatsapp-message'
import type { ChatArchiveSummary } from '@finance-ai/core/domains/whatsapp-message'
import type { MessageFidelityMetrics } from '@finance-ai/core/domains/whatsapp-message'
import type { MessageType } from '@finance-ai/core/domain/value-objects/whatsapp-enums'
import {
  isAudioTranscriptionFailed,
  isPendingAudioTranscription,
} from '@finance-ai/shared/utils'
import { WhatsappMessageMapper } from '../mappers/whatsapp-message.mapper'

export class WhatsappMessagePrismaRepository implements WhatsappMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(message: WhatsappMessage): Promise<WhatsappMessage> {
    const data = WhatsappMessageMapper.toPersistence(message)
    const saved = await this.prisma.whatsappMessage.upsert({
      where: { id: message.id },
      create: data,
      update: data,
    })
    return WhatsappMessageMapper.toDomain(saved)
  }

  async findById(id: string): Promise<WhatsappMessage | null> {
    const record = await this.prisma.whatsappMessage.findUnique({ where: { id } })
    return record ? WhatsappMessageMapper.toDomain(record) : null
  }

  async findByExternalMessageId(externalMessageId: string): Promise<WhatsappMessage | null> {
    const record = await this.prisma.whatsappMessage.findUnique({
      where: { externalMessageId },
    })
    return record ? WhatsappMessageMapper.toDomain(record) : null
  }

  async findMany(
    filters: WhatsappMessageListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<WhatsappMessage>> {
    const where = this.buildWhere(filters)
    const skip = (pagination.page - 1) * pagination.limit
    const [records, total] = await Promise.all([
      this.prisma.whatsappMessage.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      this.prisma.whatsappMessage.count({ where }),
    ])
    return {
      items: records.map(WhatsappMessageMapper.toDomain),
      total,
      page: pagination.page,
      limit: pagination.limit,
    }
  }

  async count(filters: WhatsappMessageListFilters = {}): Promise<number> {
    return this.prisma.whatsappMessage.count({ where: this.buildWhere(filters) })
  }

  async countByMessageType(): Promise<Record<string, number>> {
    const groups = await this.prisma.whatsappMessage.groupBy({
      by: ['messageType'],
      _count: { _all: true },
    })
    const result: Record<string, number> = {}
    for (const group of groups) {
      result[group.messageType] = group._count._all
    }
    return result
  }

  async countEmptyTextMessages(): Promise<number> {
    return this.prisma.whatsappMessage.count({
      where: {
        messageType: 'TEXT',
        OR: [{ content: '' }, { content: '—' }],
      },
    })
  }

  async listChatSummaries(): Promise<ChatArchiveSummary[]> {
    const groups = await this.prisma.whatsappMessage.groupBy({
      by: ['chatId'],
      _count: { _all: true },
      _max: { receivedAt: true },
    })

    const chatIds = groups.map((g) => g.chatId)
    const [chatConfigs, latestMessages, latestIncomingRows] = await Promise.all([
      this.prisma.whatsappChatConfig.findMany({ where: { chatId: { in: chatIds } } }),
      Promise.all(
        groups.map(async (group) => {
          const latest = await this.prisma.whatsappMessage.findFirst({
            where: { chatId: group.chatId },
            orderBy: { receivedAt: 'desc' },
          })
          return { chatId: group.chatId, latest }
        }),
      ),
      Promise.all(
        groups.map(async (group) => {
          const latestIncoming = await this.prisma.whatsappMessage.findFirst({
            where: { chatId: group.chatId, fromMe: false },
            orderBy: { receivedAt: 'desc' },
          })
          return { chatId: group.chatId, latestIncoming }
        }),
      ),
    ])

    const configByChatId = new Map(chatConfigs.map((c) => [c.chatId, c]))
    const latestByChatId = new Map(latestMessages.map((entry) => [entry.chatId, entry.latest]))
    const incomingByChatId = new Map(
      latestIncomingRows.map((entry) => [entry.chatId, entry.latestIncoming]),
    )
    const enabledChatIds = new Set(
      chatConfigs.filter((c) => c.archiveEnabled).map((c) => c.chatId),
    )

    const summaries: ChatArchiveSummary[] = groups
      .filter((group) => enabledChatIds.has(group.chatId))
      .map((group) => {
      const latest = latestByChatId.get(group.chatId)
      const incoming = incomingByChatId.get(group.chatId)
      const config = configByChatId.get(group.chatId)
      const configName = config?.name ?? null
      const resolvedChatName =
        configName ??
        incoming?.senderName ??
        incoming?.chatName ??
        (latest && !latest.fromMe ? latest.senderName ?? latest.chatName : null) ??
        latest?.chatName ??
        null
      return {
        chatId: group.chatId,
        displayNumber: config?.displayNumber ?? 0,
        chatName: resolvedChatName,
        messageCount: group._count._all,
        lastMessageAt: group._max.receivedAt ?? latest?.receivedAt ?? new Date(0),
        lastMessagePreview: latest?.content ?? '',
        lastMessageType: (latest?.messageType ?? 'UNKNOWN') as MessageType,
        audioProcessingEnabled: config?.audioProcessingEnabled ?? false,
      }
    })

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

    if (input.chatId && chatName) {
      const result = await this.prisma.whatsappMessage.updateMany({
        where: {
          chatId: input.chatId,
          OR: [{ chatName: null }, { chatName: '' }],
        },
        data: { chatName },
      })
      updated += result.count
    }

    if (input.senderId && senderName) {
      const result = await this.prisma.whatsappMessage.updateMany({
        where: {
          senderId: input.senderId,
          OR: [{ senderName: null }, { senderName: '' }],
        },
        data: { senderName, sender: senderName },
      })
      updated += result.count
    }

    return updated
  }

  async getFidelityMetrics(): Promise<MessageFidelityMetrics> {
    const genericNames = ['Contato', 'Grupo', 'Conversa']
    const [
      totalMessages,
      textEmpty,
      extractedTexts,
      imagesTotal,
      imagesWithCaption,
      senderResolved,
      chatRows,
      imagesProcessed,
    ] = await Promise.all([
      this.prisma.whatsappMessage.count(),
      this.prisma.whatsappMessage.count({
        where: {
          messageType: 'TEXT',
          OR: [{ content: '' }, { content: '—' }],
        },
      }),
      this.prisma.whatsappMessage.count({
        where: {
          messageType: 'TEXT',
          NOT: [{ content: '' }, { content: '—' }],
        },
      }),
      this.prisma.whatsappMessage.count({ where: { messageType: 'IMAGE' } }),
      this.prisma.whatsappMessage.count({
        where: {
          messageType: 'IMAGE',
          NOT: [{ content: '' }, { content: '[image]' }],
        },
      }),
      this.prisma.whatsappMessage.count({
        where: {
          senderName: { not: null },
          NOT: { senderName: '' },
        },
      }),
      this.prisma.whatsappMessage.groupBy({
        by: ['chatId'],
        _count: { _all: true },
      }),
      this.prisma.extraction.count({
        where: { sourceType: 'IMAGE', type: { not: 'UNKNOWN' } },
      }),
    ])

    const distinctChats = chatRows.length
    const namedChats = await this.prisma.whatsappMessage.findMany({
      where: {
        chatName: { not: null },
        NOT: { chatName: '' },
      },
      distinct: ['chatId'],
      select: { chatId: true, chatName: true },
    })
    const chatsResolved = namedChats.filter(
      (row) =>
        row.chatName &&
        !genericNames.includes(row.chatName) &&
        !row.chatName.includes('@') &&
        !/^\d{10,}$/.test(row.chatName),
    ).length

    const imagesWithoutCaption = imagesTotal - imagesWithCaption
    const imagesWithoutExtraction = Math.max(0, imagesTotal - imagesProcessed)
    const senderFallback = Math.max(0, totalMessages - senderResolved)
    const chatsFallback = Math.max(0, distinctChats - chatsResolved)

    const textExtractionRate =
      totalMessages === 0 ? 1 : extractedTexts / Math.max(1, extractedTexts + textEmpty)
    const contactResolutionRate = distinctChats === 0 ? 1 : chatsResolved / distinctChats
    const imageExtractionRate = imagesTotal === 0 ? 1 : imagesProcessed / imagesTotal

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
      textExtractionRate,
      contactResolutionRate,
      imageExtractionRate,
    }
  }

  async listStoragePathsByChatId(chatId: string): Promise<string[]> {
    const rows = await this.prisma.whatsappMessage.findMany({
      where: { chatId, storagePath: { not: null } },
      select: { storagePath: true },
    })
    return rows
      .map((row) => row.storagePath?.trim())
      .filter((path): path is string => Boolean(path))
  }

  async deleteByChatId(chatId: string): Promise<number> {
    const result = await this.prisma.whatsappMessage.deleteMany({ where: { chatId } })
    return result.count
  }

  async findRecentByChatId(
    chatId: string,
    options: { limit: number; fromMe?: boolean },
  ): Promise<WhatsappMessage[]> {
    const records = await this.prisma.whatsappMessage.findMany({
      where: {
        chatId,
        ...(options.fromMe !== undefined ? { fromMe: options.fromMe } : {}),
      },
      orderBy: { receivedAt: 'desc' },
      take: options.limit,
    })
    return records.map(WhatsappMessageMapper.toDomain)
  }

  async findByChatIdInRange(chatId: string, start: Date, end: Date): Promise<WhatsappMessage[]> {
    const records = await this.prisma.whatsappMessage.findMany({
      where: {
        chatId,
        receivedAt: { gte: start, lte: end },
      },
      orderBy: { receivedAt: 'asc' },
    })
    return records.map(WhatsappMessageMapper.toDomain)
  }

  async markSourceAgent(id: string): Promise<void> {
    await this.prisma.whatsappMessage.update({
      where: { id },
      data: { sourceAgent: true },
    })
  }

  async updateContent(id: string, content: string): Promise<WhatsappMessage> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`WhatsappMessage not found: ${id}`)
    }
    const updated = existing.withProcessedContent(content)
    return this.save(updated)
  }

  async updateStoragePath(id: string, storagePath: string): Promise<WhatsappMessage> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`WhatsappMessage not found: ${id}`)
    }
    const updated = existing.withStoredMedia({ storagePath })
    return this.save(updated)
  }

  async findPendingAudioTranscriptions(options: {
    chatId?: string
    since: Date
    limit: number
    includeFailed?: boolean
  }): Promise<WhatsappMessage[]> {
    const configs = await this.prisma.whatsappChatConfig.findMany({
      where: {
        archiveEnabled: true,
        audioProcessingEnabled: true,
        ...(options.chatId ? { chatId: options.chatId } : {}),
      },
      select: { chatId: true },
    })
    const chatIds = configs.map((config) => config.chatId)
    if (chatIds.length === 0) return []

    const records = await this.prisma.whatsappMessage.findMany({
      where: {
        messageType: 'AUDIO',
        fromMe: false,
        chatId: { in: chatIds },
        receivedAt: { gte: options.since },
      },
      orderBy: { receivedAt: 'desc' },
      take: Math.max(options.limit * 3, options.limit),
    })

    return records
      .filter((record) => {
        if (isAudioTranscriptionFailed(record.content)) {
          return options.includeFailed ?? false
        }
        return isPendingAudioTranscription(record.content)
      })
      .slice(0, options.limit)
      .map(WhatsappMessageMapper.toDomain)
  }

  private buildWhere(filters: WhatsappMessageListFilters) {
    const where: {
      processed?: boolean
      messageType?: WhatsappMessage['messageType']
      chatId?: string
      fromMe?: boolean
    } = {}
    if (filters.processed !== undefined) {
      where.processed = filters.processed
    }
    if (filters.messageType) {
      where.messageType = filters.messageType
    }
    if (filters.chatId) {
      where.chatId = filters.chatId
    }
    if (filters.fromMe !== undefined) {
      where.fromMe = filters.fromMe
    }
    return where
  }
}
