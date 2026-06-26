import type { PrismaClient } from '@prisma/client'
import type {
  ConversationDailyReportRecord,
  DailyReportBullet,
  DailyReportRepository,
} from '@finance-ai/core/domains/daily-report'

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

export class ConversationDailyReportPrismaRepository implements DailyReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(
    report: Omit<ConversationDailyReportRecord, 'id' | 'generatedAt'>,
  ): Promise<ConversationDailyReportRecord> {
    const saved = await this.prisma.conversationDailyReport.create({
      data: {
        chatId: report.chatId,
        reportDate: startOfDayUtc(report.reportDate),
        content: report.content,
        bullets: report.bullets,
        tokensInput: report.tokensInput,
        tokensOutput: report.tokensOutput,
      },
    })
    return this.toDomain(saved)
  }

  async findMany(filters: {
    year?: number
    month?: number
    chatId?: string
  }): Promise<ConversationDailyReportRecord[]> {
    const where: { chatId?: string; reportDate?: { gte: Date; lte: Date } } = {}
    if (filters.chatId?.trim()) where.chatId = filters.chatId.trim()
    if (filters.year && filters.month) {
      const start = new Date(Date.UTC(filters.year, filters.month - 1, 1))
      const end = new Date(Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999))
      where.reportDate = { gte: start, lte: end }
    }

    const rows = await this.prisma.conversationDailyReport.findMany({
      where,
      orderBy: [{ reportDate: 'desc' }, { chatId: 'asc' }],
    })
    return rows.map((row) => this.toDomain(row))
  }

  async findByChatAndDate(
    chatId: string,
    reportDate: Date,
  ): Promise<ConversationDailyReportRecord | null> {
    const row = await this.prisma.conversationDailyReport.findUnique({
      where: {
        chatId_reportDate: {
          chatId: chatId.trim(),
          reportDate: startOfDayUtc(reportDate),
        },
      },
    })
    return row ? this.toDomain(row) : null
  }

  private toDomain(row: {
    id: string
    chatId: string
    reportDate: Date
    content: string
    bullets: unknown
    tokensInput: number
    tokensOutput: number
    generatedAt: Date
  }): ConversationDailyReportRecord {
    return {
      id: row.id,
      chatId: row.chatId,
      reportDate: row.reportDate,
      content: row.content,
      bullets: (row.bullets ?? []) as DailyReportBullet[],
      tokensInput: row.tokensInput,
      tokensOutput: row.tokensOutput,
      generatedAt: row.generatedAt,
    }
  }
}
