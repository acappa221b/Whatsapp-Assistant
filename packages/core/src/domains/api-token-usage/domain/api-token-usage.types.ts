export type ApiUsageCategory =
  | 'agent_message'
  | 'photo_processing'
  | 'audio_processing'
  | 'report_generation'
  | 'other'

export type ApiTokenUsageRecord = {
  id: string
  occurredAt: Date
  category: ApiUsageCategory
  chatId: string | null
  messageId: string | null
  model: string
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  costBrl: number
  metadata?: Record<string, unknown> | null
}

export type RecordApiTokenUsageInput = {
  category: ApiUsageCategory
  chatId?: string | null
  messageId?: string | null
  model: string
  tokensInput: number
  tokensOutput: number
  metadata?: Record<string, unknown> | null
  occurredAt?: Date
}

export type ApiTokenUsageRepository = {
  record(input: RecordApiTokenUsageInput & { costBrl: number; tokensTotal: number }): Promise<ApiTokenUsageRecord>
}
