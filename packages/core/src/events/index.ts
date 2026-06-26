export const DomainEvents = {
  MessageReceived: 'MessageReceived',
  ImageReceived: 'ImageReceived',
  WhatsappConnected: 'WhatsappConnected',
  WhatsappDisconnected: 'WhatsappDisconnected',
  WhatsappMessageReceived: 'WhatsappMessageReceived',
  WhatsappMessagePersisted: 'WhatsappMessagePersisted',
  WhatsappMessageFailed: 'WhatsappMessageFailed',
  WhatsappMessageProcessed: 'WhatsappMessageProcessed',
  WhatsappChatHistoryDeleted: 'WhatsappChatHistoryDeleted',
  MessageQueued: 'MessageQueued',
  MessageProcessingStarted: 'MessageProcessingStarted',
  MessageProcessed: 'MessageProcessed',
  MessageFailed: 'MessageFailed',
  MessageSkipped: 'MessageSkipped',
  ExtractionCreated: 'ExtractionCreated',
  ExtractionFailed: 'ExtractionFailed',
  ExtractionRejected: 'ExtractionRejected',
  MediaDownloaded: 'MediaDownloaded',
  MediaStored: 'MediaStored',
  MediaUnsupported: 'MediaUnsupported',
  ImageExtractionCreated: 'ImageExtractionCreated',
  DocumentExtractionCreated: 'DocumentExtractionCreated',
  ExpenseDetected: 'ExpenseDetected',
  ExpenseApproved: 'ExpenseApproved',
  ExpenseRejected: 'ExpenseRejected',
  ExcelGenerated: 'ExcelGenerated',
  ExpenseCreated: 'ExpenseCreated',
  ExpenseUpdated: 'ExpenseUpdated',
  ExpenseSoftDeleted: 'ExpenseSoftDeleted',
  RevenueCreated: 'RevenueCreated',
  RevenueUpdated: 'RevenueUpdated',
  RevenueSoftDeleted: 'RevenueSoftDeleted',
  CategoryCreated: 'CategoryCreated',
  CategoryUpdated: 'CategoryUpdated',
  SupplierCreated: 'SupplierCreated',
  SupplierUpdated: 'SupplierUpdated',
  UserCreated: 'UserCreated',
  UserUpdated: 'UserUpdated',
} as const

export type DomainEventName = (typeof DomainEvents)[keyof typeof DomainEvents]

export interface DomainEvent<TPayload = unknown> {
  name: DomainEventName
  payload: TPayload
  occurredAt: Date
  correlationId?: string
}

export interface EventBus {
  publish<TPayload>(event: DomainEvent<TPayload>): Promise<void>
  subscribe<TPayload>(
    eventName: DomainEventName,
    handler: (event: DomainEvent<TPayload>) => Promise<void> | void,
  ): () => void
}

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<DomainEventName, Set<(event: DomainEvent) => Promise<void> | void>>()

  async publish<TPayload>(event: DomainEvent<TPayload>): Promise<void> {
    const handlers = this.handlers.get(event.name)
    if (!handlers) return
    await Promise.all([...handlers].map((handler) => Promise.resolve(handler(event))))
  }

  subscribe<TPayload>(
    eventName: DomainEventName,
    handler: (event: DomainEvent<TPayload>) => Promise<void> | void,
  ): () => void {
    const set = this.handlers.get(eventName) ?? new Set()
    set.add(handler as (event: DomainEvent) => Promise<void> | void)
    this.handlers.set(eventName, set)
    return () => set.delete(handler as (event: DomainEvent) => Promise<void> | void)
  }
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type PaginationInput = {
  page: number
  limit: number
}
