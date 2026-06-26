import { ValidationError } from '@finance-ai/shared/errors'

export function generateId(): string {
  return crypto.randomUUID()
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function validateFutureDate(date: Date, toleranceDays = 1): void {
  const limit = new Date()
  limit.setDate(limit.getDate() + toleranceDays)
  limit.setHours(23, 59, 59, 999)
  if (date > limit) {
    throw new ValidationError('Date cannot be more than 1 day in the future')
  }
}
