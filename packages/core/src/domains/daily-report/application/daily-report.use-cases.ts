import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { RecordApiTokenUsageUseCase } from '../../api-token-usage/application/record-api-token-usage.use-case'
import type {
  DailyReportGenerator,
  DailyReportRepository,
  DailyReportStorage,
} from '../domain/daily-report.types'

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

function endOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
}

function formatTimeBr(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export class GenerateDailyChatReportUseCase {
  constructor(
    private readonly chatConfigRepository: WhatsappChatConfigRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly reportRepository: DailyReportRepository,
    private readonly reportGenerator: DailyReportGenerator,
    private readonly reportStorage: DailyReportStorage,
    private readonly recordTokenUsage: RecordApiTokenUsageUseCase,
    private readonly model: string,
  ) {}

  async execute(input: { chatId: string; reportDate?: Date }) {
    const chatId = input.chatId.trim()
    const reportDate = input.reportDate ? startOfDayUtc(input.reportDate) : startOfDayUtc(new Date())

    const config = await this.chatConfigRepository.findByChatId(chatId)
    if (!config?.archiveEnabled || !config.reportGenerationEnabled) {
      return null
    }

    const existing = await this.reportRepository.findByChatAndDate(chatId, reportDate)
    if (existing) return existing

    const dayStart = startOfDayUtc(reportDate)
    const dayEnd = endOfDayUtc(reportDate)

    const messages = await this.messageRepository.findByChatIdInRange(chatId, dayStart, dayEnd)
    const transcript = messages
      .map((msg) => {
        const name = msg.senderName?.trim() || msg.sender?.trim() || msg.senderId
        return `[${formatTimeBr(msg.receivedAt)}] ${name}: ${msg.content.trim()}`
      })
      .filter((line) => line.length > 0)
      .join('\n')

    if (!transcript.trim()) {
      return null
    }

    const generated = await this.reportGenerator.generate({ chatId, reportDate, transcript })

    await this.recordTokenUsage.execute({
      category: 'report_generation',
      chatId,
      model: this.model,
      tokensInput: generated.tokensInput,
      tokensOutput: generated.tokensOutput,
      metadata: { reportDate: reportDate.toISOString().slice(0, 10) },
    })

    await this.reportStorage.saveMarkdown(chatId, reportDate, generated.content)

    return this.reportRepository.save({
      chatId,
      reportDate,
      content: generated.content,
      bullets: generated.bullets,
      tokensInput: generated.tokensInput,
      tokensOutput: generated.tokensOutput,
    })
  }
}

export class ListDailyReportsUseCase {
  constructor(private readonly reportRepository: DailyReportRepository) {}

  execute(filters: { year?: number; month?: number; chatId?: string }) {
    return this.reportRepository.findMany(filters)
  }
}
