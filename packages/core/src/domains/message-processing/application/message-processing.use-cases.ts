import { ConflictError, NotFoundError } from '../../../domain/errors'
import { generateId } from '../../../domain/utils'
import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import { DomainEvents, type EventBus } from '../../../events/index'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import { MessageProcessingJob } from '../domain/message-processing-job.entity'
import type { MessageProcessingJobRepository } from '../domain/message-processing-job.repository'
import type { MessageClassifier } from '../domain/message-classifier'
import type { MessageProcessingQueue } from '../domain/message-processing-queue'
import type { ProcessorResolver } from '../domain/processor-resolver'

export class EnqueueMessageUseCase {
  constructor(
    private readonly jobRepository: MessageProcessingJobRepository,
    private readonly queue: MessageProcessingQueue,
    private readonly eventBus: EventBus,
  ) {}

  async execute(messageId: string, messageType: MessageType): Promise<MessageProcessingJob> {
    const existing = await this.jobRepository.findByMessageId(messageId)
    if (existing && existing.status !== 'FAILED') {
      throw new ConflictError(`Message ${messageId} is already in processing pipeline`)
    }

    const job = existing
      ? existing.resetForRequeue().markQueued()
      : MessageProcessingJob.create({ id: generateId(), messageId, messageType }).markQueued()

    await this.queue.enqueue(messageId)
    const saved = await this.jobRepository.save(job)

    await this.eventBus.publish({
      name: DomainEvents.MessageQueued,
      payload: {
        jobId: saved.id,
        messageId: saved.messageId,
        messageType: saved.messageType,
      },
      occurredAt: new Date(),
    })

    return saved
  }
}

export class ProcessMessageUseCase {
  constructor(
    private readonly jobRepository: MessageProcessingJobRepository,
    private readonly whatsappRepository: WhatsappMessageRepository,
    private readonly queue: MessageProcessingQueue,
    private readonly classifier: MessageClassifier,
    private readonly resolver: ProcessorResolver,
    private readonly eventBus: EventBus,
    private readonly chatConfigRepository?: WhatsappChatConfigRepository,
  ) {}

  async execute(messageId: string): Promise<MessageProcessingJob> {
    const job = await this.jobRepository.findByMessageId(messageId)
    if (!job) throw new NotFoundError('MessageProcessingJob', messageId)

    const message = await this.whatsappRepository.findById(messageId)
    if (!message) throw new NotFoundError('WhatsappMessage', messageId)

    await this.queue.remove(messageId)

    const processing = await this.jobRepository.save(job.markProcessing())
    await this.eventBus.publish({
      name: DomainEvents.MessageProcessingStarted,
      payload: {
        jobId: processing.id,
        messageId: processing.messageId,
        messageType: processing.messageType,
      },
      occurredAt: new Date(),
    })

    try {
      const classification = this.classifier.classify(message.messageType)
      const processor = this.resolver.resolve(classification)
      const chatConfig = await this.chatConfigRepository?.findByChatId(message.chatId)
      const result = await processor.process({
        messageId: message.id,
        externalMessageId: message.externalMessageId,
        chatId: message.chatId,
        chatDisplayName: chatConfig?.name ?? message.chatName,
        chatStorageDir: chatConfig?.storageDir ?? null,
        messageType: classification,
        content: message.content,
        mediaUrl: message.mediaUrl,
        mimeType: message.mimeType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        storagePath: message.storagePath,
      })

      const storedMediaMetadata = result.metadata as {
        mediaUrl?: string | null
        mimeType?: string | null
        fileName?: string | null
        fileSize?: number | null
        storagePath?: string | null
      }

      if (storedMediaMetadata.storagePath) {
        await this.whatsappRepository.save(
          message.withStoredMedia({
            mediaUrl: storedMediaMetadata.mediaUrl ?? message.mediaUrl,
            mimeType: storedMediaMetadata.mimeType ?? message.mimeType,
            fileName: storedMediaMetadata.fileName ?? message.fileName,
            fileSize: storedMediaMetadata.fileSize ?? message.fileSize,
            storagePath: storedMediaMetadata.storagePath,
          }),
        )
      }

      await this.publishMediaEvents(message.id, classification, result.metadata)

      const completed = await this.jobRepository.save(
        processing.markCompleted({
          status: result.status,
          processor: result.processor,
          metadata: result.metadata,
          error: result.error ?? null,
        }),
      )

      await this.publishCompletionEvent(completed, result.error)
      return completed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const failed = await this.jobRepository.save(
        processing.markCompleted({
          status: 'FAILED',
          processor: 'MessageProcessingPipeline',
          metadata: {},
          error: errorMessage,
        }),
      )
      await this.eventBus.publish({
        name: DomainEvents.MessageFailed,
        payload: {
          jobId: failed.id,
          messageId: failed.messageId,
          error: errorMessage,
        },
        occurredAt: new Date(),
      })
      return failed
    }
  }

  async executeNext(): Promise<MessageProcessingJob | null> {
    const messageId = await this.queue.dequeue()
    if (!messageId) return null
    return this.execute(messageId)
  }

  private async publishCompletionEvent(job: MessageProcessingJob, error?: string): Promise<void> {
    if (job.status === 'PROCESSED') {
      await this.eventBus.publish({
        name: DomainEvents.MessageProcessed,
        payload: {
          jobId: job.id,
          messageId: job.messageId,
          processor: job.processor,
          metadata: job.metadata,
          durationMs: job.durationMs,
        },
        occurredAt: new Date(),
      })
      return
    }

    if (job.status === 'SKIPPED') {
      await this.eventBus.publish({
        name: DomainEvents.MessageSkipped,
        payload: {
          jobId: job.id,
          messageId: job.messageId,
          processor: job.processor,
          metadata: job.metadata,
        },
        occurredAt: new Date(),
      })
      return
    }

    await this.eventBus.publish({
      name: DomainEvents.MessageFailed,
      payload: {
        jobId: job.id,
        messageId: job.messageId,
        error: error ?? job.error ?? 'Processing failed',
      },
      occurredAt: new Date(),
    })
  }

  private async publishMediaEvents(
    messageId: string,
    messageType: MessageType,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    if (metadata.mediaDownloaded) {
      await this.eventBus.publish({
        name: DomainEvents.MediaDownloaded,
        payload: {
          messageId,
          messageType,
          mimeType: metadata.mimeType ?? null,
          fileName: metadata.fileName ?? null,
        },
        occurredAt: new Date(),
      })
    }

    if (metadata.mediaStored) {
      await this.eventBus.publish({
        name: DomainEvents.MediaStored,
        payload: {
          messageId,
          messageType,
          storagePath: metadata.storagePath ?? null,
          mimeType: metadata.mimeType ?? null,
          fileName: metadata.fileName ?? null,
          fileSize: metadata.fileSize ?? null,
        },
        occurredAt: new Date(),
      })
    }

    if (metadata.mediaUnsupported) {
      await this.eventBus.publish({
        name: DomainEvents.MediaUnsupported,
        payload: {
          messageId,
          messageType,
          reason: metadata.reason ?? 'Unsupported media',
          mimeType: metadata.mimeType ?? null,
        },
        occurredAt: new Date(),
      })
    }

    if (metadata.extractionId && messageType === 'IMAGE') {
      await this.eventBus.publish({
        name: DomainEvents.ImageExtractionCreated,
        payload: {
          messageId,
          extractionId: metadata.extractionId,
          model: metadata.model ?? null,
          storagePath: metadata.storagePath ?? null,
        },
        occurredAt: new Date(),
      })
    }

    if (metadata.extractionId && messageType === 'DOCUMENT') {
      await this.eventBus.publish({
        name: DomainEvents.DocumentExtractionCreated,
        payload: {
          messageId,
          extractionId: metadata.extractionId,
          model: metadata.model ?? null,
          storagePath: metadata.storagePath ?? null,
        },
        occurredAt: new Date(),
      })
    }
  }
}

export class RequeueMessageUseCase {
  constructor(
    private readonly jobRepository: MessageProcessingJobRepository,
    private readonly queue: MessageProcessingQueue,
    private readonly processMessageUseCase: ProcessMessageUseCase,
    private readonly eventBus: EventBus,
  ) {}

  async execute(messageId: string): Promise<MessageProcessingJob> {
    const job = await this.jobRepository.findByMessageId(messageId)
    if (!job) throw new NotFoundError('MessageProcessingJob', messageId)

    const requeued = await this.jobRepository.save(job.resetForRequeue())
    await this.queue.requeue(messageId)

    await this.eventBus.publish({
      name: DomainEvents.MessageQueued,
      payload: {
        jobId: requeued.id,
        messageId: requeued.messageId,
        messageType: requeued.messageType,
        requeued: true,
      },
      occurredAt: new Date(),
    })

    return this.processMessageUseCase.execute(messageId)
  }
}

export class ListProcessingJobsUseCase {
  constructor(private readonly jobRepository: MessageProcessingJobRepository) {}

  async execute(filters?: { status?: MessageProcessingJob['status'] }) {
    return this.jobRepository.findMany(filters)
  }
}

export class SkipMessageProcessingUseCase {
  constructor(
    private readonly jobRepository: MessageProcessingJobRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    messageId: string,
    messageType: MessageType,
    reason: string,
  ): Promise<MessageProcessingJob> {
    const existing = await this.jobRepository.findByMessageId(messageId)
    if (existing && existing.status !== 'FAILED') {
      return existing
    }

    const now = new Date()
    const job = (existing ??
      MessageProcessingJob.create({ id: generateId(), messageId, messageType, now }))
      .markQueued(now)
      .markProcessing(now)

    const skipped = await this.jobRepository.save(
      job.markCompleted({
        status: 'SKIPPED',
        processor: 'ChatGovernance',
        metadata: { reason, governance: 'aiProcessingDisabled' },
        now,
      }),
    )

    await this.eventBus.publish({
      name: DomainEvents.MessageSkipped,
      payload: {
        jobId: skipped.id,
        messageId: skipped.messageId,
        processor: skipped.processor,
        metadata: skipped.metadata,
      },
      occurredAt: new Date(),
    })

    return skipped
  }
}
