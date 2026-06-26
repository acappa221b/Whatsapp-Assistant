export type DailyReportBullet = {
  time: string
  text: string
  resolvedAt?: string
  participants?: string[]
}

export type ConversationDailyReportRecord = {
  id: string
  chatId: string
  reportDate: Date
  content: string
  bullets: DailyReportBullet[]
  tokensInput: number
  tokensOutput: number
  generatedAt: Date
}

export type DailyReportRepository = {
  save(report: Omit<ConversationDailyReportRecord, 'id' | 'generatedAt'>): Promise<ConversationDailyReportRecord>
  findMany(filters: { year?: number; month?: number; chatId?: string }): Promise<ConversationDailyReportRecord[]>
  findByChatAndDate(chatId: string, reportDate: Date): Promise<ConversationDailyReportRecord | null>
}

export type DailyReportGenerator = {
  generate(input: {
    chatId: string
    reportDate: Date
    transcript: string
  }): Promise<{
    content: string
    bullets: DailyReportBullet[]
    tokensInput: number
    tokensOutput: number
  }>
}

export type DailyReportStorage = {
  saveMarkdown(chatId: string, reportDate: Date, content: string): Promise<string>
}
