/** Base contract for event payloads — no business fields. */
export interface EventPayloadBase {
  correlationId?: string
}

/** Event names aligned with @finance-ai/core DomainEvents (duplicated to avoid circular deps). */
export type EventName =
  | 'MessageReceived'
  | 'ImageReceived'
  | 'ExpenseDetected'
  | 'ExpenseApproved'
  | 'ExpenseRejected'
  | 'ExcelGenerated'
