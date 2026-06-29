import {
  ConversationDailyReportPrismaRepository,
  AppSettingsPrismaRepository,
  prisma,
  ApiTokenUsagePrismaRepository,
} from '@finance-ai/database'
import { RecordApiTokenUsageUseCase } from '@finance-ai/core/domains/api-token-usage'
import {
  GenerateDailyChatReportUseCase,
  ListDailyReportsUseCase,
} from '@finance-ai/core/domains/daily-report'
import { config } from '@finance-ai/shared/config'
import { FileDailyReportStorage } from '@/lib/reports/daily-report-storage'
import type { WhatsappChatConfigRepository } from '@finance-ai/core/domains/whatsapp-chat-config'
import type { WhatsappMessageRepository } from '@finance-ai/core/domains/whatsapp-message'
import { createDailyReportProvider } from '@/lib/ai/ai-provider-service'
import { OpenAIDailyReportProvider, type DailyReportBullet } from '@finance-ai/ai'

let dailyReportJobStarted = false

function yesterdayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date(Date.now() - 86_400_000))
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return `${year}-${month}-${day}`
}

function currentTimeInTimezone(timezone: string): { hour: number; minute: number; dateKey: string } {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return { hour, minute, dateKey: `${year}-${month}-${day}` }
}

export function createDailyReportServices(deps: {
  chatConfigRepository: WhatsappChatConfigRepository
  messageRepository: WhatsappMessageRepository
}) {
  const reportRepository = new ConversationDailyReportPrismaRepository(prisma)
  const recordTokenUsage = new RecordApiTokenUsageUseCase(
    new ApiTokenUsagePrismaRepository(prisma),
    config.openai,
  )

  const reportProvider: {
    generate: (input: { chatId: string; reportDate: Date; transcript: string }) => Promise<{
      content: string
      bullets: DailyReportBullet[]
      tokensInput: number
      tokensOutput: number
    }>
  } = {
    generate: async (input) => {
      const provider =
        (await createDailyReportProvider()) ??
        new OpenAIDailyReportProvider()
      return provider.generate(input)
    },
  }

  const generateDailyChatReport = new GenerateDailyChatReportUseCase(
    deps.chatConfigRepository,
    deps.messageRepository,
    reportRepository,
    reportProvider,
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
  const settingsRepo = new AppSettingsPrismaRepository(prisma)

  const run = async () => {
    const settings = await settingsRepo.get()
    if (!settings.reportAutoEnabled) return

    const [targetHour, targetMinute] = settings.reportAutoTime.split(':').map((v) => Number(v))
    const { hour, minute, dateKey } = currentTimeInTimezone(settings.reportTimezone)
    if (hour !== targetHour || minute !== targetMinute) return
    if (settings.lastAutoReportRunDate === dateKey) return

    const configs = await deps.chatConfigRepository.findAll()
    const enabled = configs.filter((c) => c.archiveEnabled && c.reportGenerationEnabled)
    for (const chat of enabled) {
      try {
        const reportDate = new Date(`${yesterdayInTimezone(settings.reportTimezone)}T12:00:00`)
        await generateDailyChatReport.execute({ chatId: chat.chatId, reportDate })
        console.info('[DailyReport] auto run at', settings.reportAutoTime, chat.chatId, chat.displayNumber)
      } catch (error) {
        console.error('[DailyReport] failed', chat.chatId, error)
      }
    }

    await settingsRepo.update({ lastAutoReportRunDate: dateKey })
  }

  setInterval(() => void run(), 60_000)
}
