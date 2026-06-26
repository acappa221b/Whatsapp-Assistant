import { ValidationError } from '@finance-ai/shared/errors'

export const PROCESSING_STATUSES = [
  'RECEIVED',
  'QUEUED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'SKIPPED',
] as const

export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number]

export function assertProcessingStatus(value: string): ProcessingStatus {
  if (!PROCESSING_STATUSES.includes(value as ProcessingStatus)) {
    throw new ValidationError(`Invalid processing status: ${value}`)
  }
  return value as ProcessingStatus
}
