import type { ProcessingStatus } from './processing-enums'

export type ProcessingResult = {
  messageId: string
  processor: string
  status: Extract<ProcessingStatus, 'PROCESSED' | 'FAILED' | 'SKIPPED'>
  metadata: Record<string, unknown>
  processedAt: Date
  error?: string
}
