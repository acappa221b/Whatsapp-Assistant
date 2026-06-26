import {
  ConversationDailyReportPrismaRepository,
  prisma,
  ApiTokenUsagePrismaRepository,
} from '@finance-ai/database'
import { RecordApiTokenUsageUseCase } from '@finance-ai/core/domains/api-token-usage'
import {
  GenerateDailyChatReportUseCase,
  ListDailyReportsUseCase,
} from '@finance-ai/core/domains/daily-report'
import { OpenAIDailyReportProvider } from '@finance-ai/ai'
import { config } from '@finance-ai/shared/config'
import { FileDailyReportStorage } from '@/lib/reports/daily-report-storage'
import type { WhatsappChatConfigRepository } from '@finance-ai/core/domains/whatsapp-chat-config'
import type { WhatsappMessageRepository } from '@finance-ai/core/domains/whatsapp-message'

let dailyReportJobStarted = false

export function createDailyReportServices(deps: {
  chatConfigRepository: WhatsappChatConfigRepository
  messageRepository: WhatsappMessageRepository
}) {
  const reportRepository = new ConversationDailyReportPrismaRepository(prisma)
  const recordTokenUsage = new RecordApiTokenUsageUseCase(
    new ApiTokenUsagePrismaRepository(prisma),
    config.openai,
  )
  const generateDailyChatReport = new GenerateDailyChatReportUseCase(
    deps.chatConfigRepository,
    deps.messageRepository,
    reportRepository,
    new OpenAIDailyReportProvider(),
    new FileDailyReportStorage(deps.chatConfigRepository),
    recordTokenUsage,
    config.openai.model,
  )
  const listDailyReports = new ListDailyReportsUseCase(reportRepository)

  return { generateDailyChatReport, listDailyReports }
}

export function registerDailyReportJob(deps: {
  chatConfigRepository: WhatsappChatConfigRepository
  messageRepository: WhatsappMessageRepository
}): void {
  if (dailyReportJobStarted) return
  dailyReportJobStarted = true

  const { generateDailyChatReport } = createDailyReportServices(deps)

  const run = async () => {
    const now = new Date()
    if (now.getHours() !== 23 || now.getMinutes() < 55) return

    const configs = await deps.chatConfigRepository.findAll()
    const enabled = configs.filter((c) => c.archiveEnabled && c.reportGenerationEnabled)
    for (const chat of enabled) {
      try {
        await generateDailyChatReport.execute({ chatId: chat.chatId })
        console.info('[DailyReport]', chat.chatId, chat.displayNumber)
      } catch (error) {
        console.error('[DailyReport] failed', chat.chatId, error)
      }
    }
  }

  setInterval(() => void run(), 60_000)
}
