import { ValidationError } from '@finance-ai/shared/errors'

export const EXTRACTION_TYPES = ['EXPENSE_CANDIDATE', 'REVENUE_CANDIDATE', 'UNKNOWN'] as const

export type ExtractionType = (typeof EXTRACTION_TYPES)[number]

export function assertExtractionType(value: string): ExtractionType {
  if (!EXTRACTION_TYPES.includes(value as ExtractionType)) {
    throw new ValidationError(`Invalid extraction type: ${value}`)
  }
  return value as ExtractionType
}
