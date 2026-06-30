export type DailySeriesPoint = { date: string; count: number; costBrl?: number }
export type DailySeries = DailySeriesPoint[]

export type CostCategoryFilter =
  | 'total'
  | 'agent_message'
  | 'photo_processing'
  | 'audio_processing'
  | 'report_generation'
  | 'assistant_chat'

export type DashboardMetrics = {
  year: number
  month: number
  general: {
    messages: DailySeries
    agentMessages: DailySeries
    activeUsers: DailySeries
    photos: DailySeries
  }
  costs: {
    tokenUsage: DailySeries
    tokensByCategory: {
      agent_message: DailySeries
      photo_processing: DailySeries
      audio_processing: DailySeries
      report_generation: DailySeries
      assistant_chat: DailySeries
    }
    costBrl: DailySeries
    costByCategory: {
      agent_message: DailySeries
      photo_processing: DailySeries
      audio_processing: DailySeries
      report_generation: DailySeries
      assistant_chat: DailySeries
    }
    averageCostBrl: {
      agent_message: number
      photo_processing: number
      audio_processing: number
      report_generation: number
      assistant_chat: number
    }
  }
}

export function buildMonthDayKeys(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthStr = String(month).padStart(2, '0')
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, '0')
    return `${year}-${monthStr}-${day}`
  })
}

export function fillDailySeries(
  year: number,
  month: number,
  countsByDate: Map<string, number>,
): DailySeries {
  return buildMonthDayKeys(year, month).map((date) => ({
    date,
    count: countsByDate.get(date) ?? 0,
  }))
}

export function fillDailySeriesWithCost(
  year: number,
  month: number,
  tokensByDate: Map<string, number>,
  costByDate: Map<string, number>,
): DailySeries {
  return buildMonthDayKeys(year, month).map((date) => ({
    date,
    count: tokensByDate.get(date) ?? 0,
    costBrl: costByDate.get(date) ?? 0,
  }))
}

export function monthRangeUtc(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start, end }
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export type DashboardAnalyticsRepository = {
  getMetrics(year: number, month: number): Promise<DashboardMetrics>
}
