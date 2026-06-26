import { ValidationError } from '@finance-ai/shared/errors'
import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import { assertProcessingStatus, type ProcessingStatus } from './processing-enums'

export type MessageProcessingJobProps = {
  id: string
  messageId: string
  messageType: MessageType
  status: ProcessingStatus
  processor: string | null
  metadata: Record<string, unknown>
  error: string | null
  queuedAt: Date | null
  startedAt: Date | null
  processedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class MessageProcessingJob {
  readonly id: string
  readonly messageId: string
  readonly messageType: MessageType
  readonly status: ProcessingStatus
  readonly processor: string | null
  readonly metadata: Record<string, unknown>
  readonly error: string | null
  readonly queuedAt: Date | null
  readonly startedAt: Date | null
  readonly processedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: MessageProcessingJobProps) {
    this.id = props.id
    this.messageId = props.messageId
    this.messageType = props.messageType
    this.status = props.status
    this.processor = props.processor
    this.metadata = props.metadata
    this.error = props.error
    this.queuedAt = props.queuedAt
    this.startedAt = props.startedAt
    this.processedAt = props.processedAt
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: {
    id: string
    messageId: string
    messageType: MessageType
    now?: Date
  }): MessageProcessingJob {
    const messageId = input.messageId.trim()
    if (!messageId) throw new ValidationError('Message ID is required')
    const now = input.now ?? new Date()
    return new MessageProcessingJob({
      id: input.id,
      messageId,
      messageType: input.messageType,
      status: 'RECEIVED',
      processor: null,
      metadata: {},
      error: null,
      queuedAt: null,
      startedAt: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: MessageProcessingJobProps): MessageProcessingJob {
    assertProcessingStatus(props.status)
    return new MessageProcessingJob(props)
  }

  markQueued(now: Date = new Date()): MessageProcessingJob {
    return new MessageProcessingJob({
      ...this,
      status: 'QUEUED',
      queuedAt: now,
      updatedAt: now,
    })
  }

  markProcessing(now: Date = new Date()): MessageProcessingJob {
    return new MessageProcessingJob({
      ...this,
      status: 'PROCESSING',
      startedAt: now,
      updatedAt: now,
    })
  }

  markCompleted(input: {
    status: Extract<ProcessingStatus, 'PROCESSED' | 'FAILED' | 'SKIPPED'>
    processor: string
    metadata: Record<string, unknown>
    error?: string | null
    now?: Date
  }): MessageProcessingJob {
    const now = input.now ?? new Date()
    return new MessageProcessingJob({
      ...this,
      status: input.status,
      processor: input.processor,
      metadata: input.metadata,
      error: input.error ?? null,
      processedAt: now,
      updatedAt: now,
    })
  }

  resetForRequeue(now: Date = new Date()): MessageProcessingJob {
    return new MessageProcessingJob({
      ...this,
      status: 'QUEUED',
      processor: null,
      metadata: {},
      error: null,
      queuedAt: now,
      startedAt: null,
      processedAt: null,
      updatedAt: now,
    })
  }

  get durationMs(): number | null {
    if (!this.startedAt || !this.processedAt) return null
    return this.processedAt.getTime() - this.startedAt.getTime()
  }
}
