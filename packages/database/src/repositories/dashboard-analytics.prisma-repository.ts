import type { PrismaClient } from '@prisma/client'
import type {
  DashboardAnalyticsRepository,
  DashboardMetrics,
} from '@finance-ai/core/domains/dashboard-analytics'
import { fillDailySeries, monthRangeUtc, toDateKey } from '@finance-ai/core/domains/dashboard-analytics'

export class DashboardAnalyticsPrismaRepository implements DashboardAnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMetrics(year: number, month: number): Promise<DashboardMetrics> {
    const { start, end } = monthRangeUtc(year, month)

    const archivedChats = await this.prisma.whatsappChatConfig.findMany({
      where: { archiveEnabled: true },
      select: { chatId: true },
    })
    const archivedChatIds = archivedChats.map((c) => c.chatId)

    const [incomingMessages, outgoingAgentMessages, photos, tokenUsage] = await Promise.all([
      archivedChatIds.length
        ? this.prisma.whatsappMessage.findMany({
            where: {
              chatId: { in: archivedChatIds },
              fromMe: false,
              receivedAt: { gte: start, lte: end },
            },
            select: { receivedAt: true, senderId: true },
          })
        : [],
      archivedChatIds.length
        ? this.prisma.whatsappMessage.findMany({
            where: {
              chatId: { in: archivedChatIds },
              fromMe: true,
              receivedAt: { gte: start, lte: end },
              OR: [{ sourceAgent: true }],
            },
            select: { receivedAt: true, id: true },
          })
        : [],
      archivedChatIds.length
        ? this.prisma.whatsappMessage.findMany({
            where: {
              chatId: { in: archivedChatIds },
              messageType: 'IMAGE',
              receivedAt: { gte: start, lte: end },
            },
            select: { receivedAt: true },
          })
        : [],
      this.prisma.apiTokenUsage.findMany({
        where: { occurredAt: { gte: start, lte: end } },
        select: {
          occurredAt: true,
          category: true,
          tokensTotal: true,
          costBrl: true,
        },
      }),
    ])

    const agentMessageIdsFromTokens = new Set(
      (
        await this.prisma.apiTokenUsage.findMany({
          where: {
            category: 'agent_message',
            occurredAt: { gte: start, lte: end },
            messageId: { not: null },
          },
          select: { messageId: true },
        })
      )
        .map((row) => row.messageId)
        .filter((id): id is string => Boolean(id)),
    )

    const extraAgentMessages =
      archivedChatIds.length && agentMessageIdsFromTokens.size
        ? await this.prisma.whatsappMessage.findMany({
            where: {
              chatId: { in: archivedChatIds },
              fromMe: true,
              id: { in: [...agentMessageIdsFromTokens] },
              receivedAt: { gte: start, lte: end },
              sourceAgent: false,
            },
            select: { receivedAt: true },
          })
        : []

    const messagesByDay = new Map<string, number>()
    const activeUsersByDay = new Map<string, Set<string>>()
    for (const msg of incomingMessages) {
      const key = toDateKey(msg.receivedAt)
      messagesByDay.set(key, (messagesByDay.get(key) ?? 0) + 1)
      if (!activeUsersByDay.has(key)) activeUsersByDay.set(key, new Set())
      activeUsersByDay.get(key)!.add(msg.senderId)
    }

    const agentByDay = new Map<string, number>()
    for (const msg of [...outgoingAgentMessages, ...extraAgentMessages]) {
      const key = toDateKey(msg.receivedAt)
      agentByDay.set(key, (agentByDay.get(key) ?? 0) + 1)
    }

    const photosByDay = new Map<string, number>()
    for (const msg of photos) {
      const key = toDateKey(msg.receivedAt)
      photosByDay.set(key, (photosByDay.get(key) ?? 0) + 1)
    }

    const activeUsersSeries = new Map<string, number>()
    for (const [date, users] of activeUsersByDay) {
      activeUsersSeries.set(date, users.size)
    }

    const tokenByDay = new Map<string, number>()
    const costByDay = new Map<string, number>()
    const tokensByCategory = {
      agent_message: new Map<string, number>(),
      photo_processing: new Map<string, number>(),
      audio_processing: new Map<string, number>(),
      report_generation: new Map<string, number>(),
    }
    const costByCategory = {
      agent_message: new Map<string, number>(),
      photo_processing: new Map<string, number>(),
      audio_processing: new Map<string, number>(),
      report_generation: new Map<string, number>(),
    }
    const categoryTotals = {
      agent_message: { cost: 0, count: 0 },
      photo_processing: { cost: 0, count: 0 },
      audio_processing: { cost: 0, count: 0 },
      report_generation: { cost: 0, count: 0 },
    }

    for (const row of tokenUsage) {
      const key = toDateKey(row.occurredAt)
      tokenByDay.set(key, (tokenByDay.get(key) ?? 0) + row.tokensTotal)
      costByDay.set(key, (costByDay.get(key) ?? 0) + row.costBrl)

      if (row.category in tokensByCategory) {
        const cat = row.category as keyof typeof tokensByCategory
        tokensByCategory[cat].set(key, (tokensByCategory[cat].get(key) ?? 0) + row.tokensTotal)
        costByCategory[cat].set(key, (costByCategory[cat].get(key) ?? 0) + row.costBrl)
        categoryTotals[cat].cost += row.costBrl
        categoryTotals[cat].count += 1
      }
    }

    const averageCostBrl = {
      agent_message:
        categoryTotals.agent_message.count > 0
          ? categoryTotals.agent_message.cost / categoryTotals.agent_message.count
          : 0,
      photo_processing:
        categoryTotals.photo_processing.count > 0
          ? categoryTotals.photo_processing.cost / categoryTotals.photo_processing.count
          : 0,
      audio_processing:
        categoryTotals.audio_processing.count > 0
          ? categoryTotals.audio_processing.cost / categoryTotals.audio_processing.count
          : 0,
      report_generation:
        categoryTotals.report_generation.count > 0
          ? categoryTotals.report_generation.cost / categoryTotals.report_generation.count
          : 0,
    }

    return {
      year,
      month,
      general: {
        messages: fillDailySeries(year, month, messagesByDay),
        agentMessages: fillDailySeries(year, month, agentByDay),
        activeUsers: fillDailySeries(year, month, activeUsersSeries),
        photos: fillDailySeries(year, month, photosByDay),
      },
      costs: {
        tokenUsage: fillDailySeries(year, month, tokenByDay),
        tokensByCategory: {
          agent_message: fillDailySeries(year, month, tokensByCategory.agent_message),
          photo_processing: fillDailySeries(year, month, tokensByCategory.photo_processing),
          audio_processing: fillDailySeries(year, month, tokensByCategory.audio_processing),
          report_generation: fillDailySeries(year, month, tokensByCategory.report_generation),
        },
        costBrl: fillDailySeries(year, month, costByDay),
        costByCategory: {
          agent_message: fillDailySeries(year, month, costByCategory.agent_message),
          photo_processing: fillDailySeries(year, month, costByCategory.photo_processing),
          audio_processing: fillDailySeries(year, month, costByCategory.audio_processing),
          report_generation: fillDailySeries(year, month, costByCategory.report_generation),
        },
        averageCostBrl,
      },
    }
  }
}
