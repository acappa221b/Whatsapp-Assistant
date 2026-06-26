import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError, NotFoundError } from '@finance-ai/core/domain/errors'
import { DomainEvents, InMemoryEventBus } from '@finance-ai/core/events'
import { WhatsappMessage } from '../../whatsapp-message/domain/whatsapp-message.entity'
import { InMemoryWhatsappMessageRepository } from '../../whatsapp-message/infrastructure/in-memory-whatsapp-message.repository'
import { MessageProcessingPipeline } from '../application/message-processing.pipeline'
import { MessageProcessingJob } from '../domain/message-processing-job.entity'
import {
  EnqueueMessageUseCase,
  ListProcessingJobsUseCase,
  ProcessMessageUseCase,
  RequeueMessageUseCase,
  SkipMessageProcessingUseCase,
} from '../application/message-processing.use-cases'
import { InMemoryWhatsappChatConfigRepository, WhatsappChatConfig } from '../../whatsapp-chat-config'
import { DefaultProcessorResolver } from '../infrastructure/default-processor-resolver'
import { InMemoryMessageProcessingJobRepository } from '../infrastructure/in-memory-message-processing-job.repository'
import { InMemoryMessageProcessingQueue } from '../infrastructure/in-memory-message-processing-queue'
import { MessageTypeClassifier } from '../infrastructure/message-type-classifier'
import {
  AudioMessageProcessor,
  DocumentMessageProcessor,
  ImageMessageProcessor,
  TextMessageProcessor,
  UnknownMessageProcessor,
} from '../infrastructure/processors/stub-processors'

describe('Message processing use cases', () => {
  let eventBus: InMemoryEventBus
  let jobRepository: InMemoryMessageProcessingJobRepository
  let whatsappRepository: InMemoryWhatsappMessageRepository
  let chatConfigRepository: InMemoryWhatsappChatConfigRepository
  let queue: InMemoryMessageProcessingQueue

  beforeEach(() => {
    eventBus = new InMemoryEventBus()
    jobRepository = new InMemoryMessageProcessingJobRepository()
    whatsappRepository = new InMemoryWhatsappMessageRepository()
    chatConfigRepository = new InMemoryWhatsappChatConfigRepository()
    queue = new InMemoryMessageProcessingQueue()
  })

  async function seedMessage(id = 'msg-1', messageType: 'TEXT' | 'UNKNOWN' = 'TEXT') {
    const message = WhatsappMessage.create({
      id,
      externalMessageId: `ext-${id}`,
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      content: 'Teste',
      messageType,
      rawPayload: { key: { id: `ext-${id}` } },
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
    await whatsappRepository.save(message)
    return message
  }

  function createProcessUseCase() {
    const resolver = new DefaultProcessorResolver([
      new TextMessageProcessor({
        execute: async ({ messageId }) => ({
          id: `ext-${messageId}`,
          messageId,
          type: 'EXPENSE_CANDIDATE' as const,
          confidence: 0.97,
          data: { description: 'Balas', amount: 4, confidence: 0.97 },
          model: 'mock-gpt',
          createdAt: new Date(),
        }),
      }),
      new ImageMessageProcessor(),
      new DocumentMessageProcessor(),
      new AudioMessageProcessor(),
      new UnknownMessageProcessor(),
    ])

    return new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      resolver,
      eventBus,
    )
  }

  it('EnqueueMessage publishes MessageQueued', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.MessageQueued, () => events.push('queued'))
    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')
    expect(events).toEqual(['queued'])
    expect(await queue.contains('msg-1')).toBe(true)
  })

  it('ProcessMessage emits lifecycle events for TEXT', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.MessageProcessingStarted, () => events.push('started'))
    eventBus.subscribe(DomainEvents.MessageProcessed, () => events.push('processed'))

    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')
    const job = await createProcessUseCase().execute('msg-1')

    expect(events).toEqual(['started', 'processed'])
    expect(job.status).toBe('PROCESSED')
    expect(job.processor).toBe('TextMessageProcessor')
    expect(await queue.contains('msg-1')).toBe(false)
  })

  it('ProcessMessage emits multimodal media events and stores media metadata', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.MediaDownloaded, () => events.push('downloaded'))
    eventBus.subscribe(DomainEvents.MediaStored, () => events.push('stored'))
    eventBus.subscribe(DomainEvents.ImageExtractionCreated, () => events.push('image'))

    const message = WhatsappMessage.create({
      id: 'msg-img',
      externalMessageId: 'ext-msg-img',
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      rawPayload: { key: { id: 'ext-msg-img' } },
      content: 'recibo',
      messageType: 'IMAGE',
      mimeType: 'image/jpeg',
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
    await whatsappRepository.save(message)
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-img', 'IMAGE')

    const job = await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'ImageMessageProcessor',
          canProcess: () => true,
          process: async () => ({
            messageId: 'msg-img',
            processor: 'ImageMessageProcessor',
            status: 'PROCESSED' as const,
            metadata: {
              extractionId: 'ext-msg-img',
              extractionType: 'EXPENSE_CANDIDATE',
              model: 'mock-gpt',
              mimeType: 'image/jpeg',
              fileName: 'receipt.jpg',
              fileSize: 321,
              storagePath: 'receipt.jpg',
              mediaDownloaded: true,
              mediaStored: true,
            },
            processedAt: new Date(),
          }),
        }),
      },
      eventBus,
    ).execute('msg-img')

    expect(job.status).toBe('PROCESSED')
    expect(events).toEqual(['downloaded', 'stored', 'image'])
    const storedMessage = await whatsappRepository.findById('msg-img')
    expect(storedMessage?.storagePath).toBe('receipt.jpg')
  })

  it('ProcessMessage emits MediaUnsupported for rejected media', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.MediaUnsupported, () => events.push('unsupported'))

    const message = WhatsappMessage.create({
      id: 'msg-doc',
      externalMessageId: 'ext-msg-doc',
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      rawPayload: { key: { id: 'ext-msg-img' } },
      content: 'arquivo',
      messageType: 'DOCUMENT',
      mimeType: 'application/xml',
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
    await whatsappRepository.save(message)
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-doc', 'DOCUMENT')

    const job = await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'DocumentMessageProcessor',
          canProcess: () => true,
          process: async () => ({
            messageId: 'msg-doc',
            processor: 'DocumentMessageProcessor',
            status: 'SKIPPED' as const,
            metadata: {
              extractionId: 'ext-msg-doc',
              model: 'system-media-validator',
              reason: 'Unsupported media mime type: application/xml',
              mimeType: 'application/xml',
              mediaUnsupported: true,
            },
            processedAt: new Date(),
          }),
        }),
      },
      eventBus,
    ).execute('msg-doc')

    expect(job.status).toBe('SKIPPED')
    expect(events).toEqual(['unsupported'])
  })

  it('ProcessMessage emits DocumentExtractionCreated with null-safe metadata fallbacks', async () => {
    const events: Array<Record<string, unknown>> = []
    eventBus.subscribe(DomainEvents.DocumentExtractionCreated, (event) =>
      events.push(event.payload as Record<string, unknown>),
    )

    const message = WhatsappMessage.create({
      id: 'msg-doc-created',
      externalMessageId: 'ext-msg-doc-created',
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      rawPayload: { key: { id: 'ext-msg-img' } },
      content: 'pdf',
      messageType: 'DOCUMENT',
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
    await whatsappRepository.save(message)
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute(
      'msg-doc-created',
      'DOCUMENT',
    )

    await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'DocumentMessageProcessor',
          canProcess: () => true,
          process: async () => ({
            messageId: 'msg-doc-created',
            processor: 'DocumentMessageProcessor',
            status: 'PROCESSED' as const,
            metadata: {
              extractionId: 'ext-doc-created',
            },
            processedAt: new Date(),
          }),
        }),
      },
      eventBus,
    ).execute('msg-doc-created')

    expect(events).toEqual([
      {
        messageId: 'msg-doc-created',
        extractionId: 'ext-doc-created',
        model: null,
        storagePath: null,
      },
    ])
  })

  it('ProcessMessage emits ImageExtractionCreated with null-safe metadata fallbacks', async () => {
    const events: Array<Record<string, unknown>> = []
    eventBus.subscribe(DomainEvents.ImageExtractionCreated, (event) =>
      events.push(event.payload as Record<string, unknown>),
    )

    const message = WhatsappMessage.create({
      id: 'msg-img-created-null',
      externalMessageId: 'ext-msg-img-created-null',
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      rawPayload: { key: { id: 'ext-msg-img' } },
      content: 'img',
      messageType: 'IMAGE',
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
    await whatsappRepository.save(message)
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute(
      'msg-img-created-null',
      'IMAGE',
    )

    await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'ImageMessageProcessor',
          canProcess: () => true,
          process: async () => ({
            messageId: 'msg-img-created-null',
            processor: 'ImageMessageProcessor',
            status: 'PROCESSED' as const,
            metadata: {
              extractionId: 'ext-img-created-null',
            },
            processedAt: new Date(),
          }),
        }),
      },
      eventBus,
    ).execute('msg-img-created-null')

    expect(events).toEqual([
      {
        messageId: 'msg-img-created-null',
        extractionId: 'ext-img-created-null',
        model: null,
        storagePath: null,
      },
    ])
  })

  it('ProcessMessage emits MediaStored with null-safe metadata fallbacks', async () => {
    const events: Array<Record<string, unknown>> = []
    eventBus.subscribe(DomainEvents.MediaStored, (event) =>
      events.push(event.payload as Record<string, unknown>),
    )

    const message = WhatsappMessage.create({
      id: 'msg-stored-null',
      externalMessageId: 'ext-msg-stored-null',
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      rawPayload: { key: { id: 'ext-msg-img' } },
      content: 'img',
      messageType: 'IMAGE',
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
    await whatsappRepository.save(message)
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-stored-null', 'IMAGE')

    await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'ImageMessageProcessor',
          canProcess: () => true,
          process: async () => ({
            messageId: 'msg-stored-null',
            processor: 'ImageMessageProcessor',
            status: 'PROCESSED' as const,
            metadata: {
              extractionId: 'ext-stored-null',
              mediaStored: true,
            },
            processedAt: new Date(),
          }),
        }),
      },
      eventBus,
    ).execute('msg-stored-null')

    expect(events).toEqual([
      {
        messageId: 'msg-stored-null',
        messageType: 'IMAGE',
        storagePath: null,
        mimeType: null,
        fileName: null,
        fileSize: null,
      },
    ])
  })

  it('ProcessMessage emits MediaUnsupported with default reason when missing', async () => {
    const events: Array<Record<string, unknown>> = []
    eventBus.subscribe(DomainEvents.MediaUnsupported, (event) =>
      events.push(event.payload as Record<string, unknown>),
    )

    const message = WhatsappMessage.create({
      id: 'msg-unsupported-default',
      externalMessageId: 'ext-msg-unsupported-default',
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      rawPayload: { key: { id: 'ext-msg-img' } },
      content: 'bad media',
      messageType: 'IMAGE',
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
    await whatsappRepository.save(message)
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute(
      'msg-unsupported-default',
      'IMAGE',
    )

    await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'ImageMessageProcessor',
          canProcess: () => true,
          process: async () => ({
            messageId: 'msg-unsupported-default',
            processor: 'ImageMessageProcessor',
            status: 'SKIPPED' as const,
            metadata: {
              mediaUnsupported: true,
            },
            processedAt: new Date(),
          }),
        }),
      },
      eventBus,
    ).execute('msg-unsupported-default')

    expect(events).toEqual([
      {
        messageId: 'msg-unsupported-default',
        messageType: 'IMAGE',
        reason: 'Unsupported media',
        mimeType: null,
      },
    ])
  })

  it('ProcessMessage emits MessageSkipped for UNKNOWN type', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.MessageSkipped, () => events.push('skipped'))

    await seedMessage('msg-u', 'UNKNOWN')
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-u', 'UNKNOWN')
    const job = await createProcessUseCase().execute('msg-u')

    expect(events).toEqual(['skipped'])
    expect(job.status).toBe('SKIPPED')
  })

  it('ProcessMessage emits MessageFailed when processor throws', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.MessageFailed, () => events.push('failed'))

    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')

    const failingResolver = {
      resolve: () => ({
        name: 'FailingProcessor',
        canProcess: () => true,
        process: vi.fn().mockRejectedValue(new Error('processor boom')),
      }),
    }

    const job = await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      failingResolver,
      eventBus,
    ).execute('msg-1')

    expect(events).toEqual(['failed'])
    expect(job.status).toBe('FAILED')
    expect(job.error).toBe('processor boom')
  })

  it('EnqueueMessage rejects duplicate non-failed jobs', async () => {
    await seedMessage()
    const enqueue = new EnqueueMessageUseCase(jobRepository, queue, eventBus)
    await enqueue.execute('msg-1', 'TEXT')
    await expect(enqueue.execute('msg-1', 'TEXT')).rejects.toBeInstanceOf(ConflictError)
  })

  it('EnqueueMessage reuses FAILED job record', async () => {
    await seedMessage()
    const enqueue = new EnqueueMessageUseCase(jobRepository, queue, eventBus)
    const first = await enqueue.execute('msg-1', 'TEXT')

    await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'FailProcessor',
          canProcess: () => true,
          process: async () => {
            throw new Error('fail')
          },
        }),
      },
      eventBus,
    ).execute('msg-1')

    const reEnqueued = await enqueue.execute('msg-1', 'TEXT')
    expect(reEnqueued.id).toBe(first.id)
    expect(reEnqueued.status).toBe('QUEUED')
  })

  it('ProcessMessage throws when job or message is missing', async () => {
    await expect(createProcessUseCase().execute('missing')).rejects.toBeInstanceOf(NotFoundError)

    await jobRepository.save(
      MessageProcessingJob.create({ id: 'job-ghost', messageId: 'ghost', messageType: 'TEXT' }).markQueued(),
    )
    await expect(createProcessUseCase().execute('ghost')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('ProcessMessage handles non-Error throws', async () => {
    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')
    await jobRepository.save(
      (await jobRepository.findByMessageId('msg-1'))!.markQueued(),
    )

    const job = await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'ThrowString',
          canProcess: () => true,
          process: async () => {
            throw 'string failure'
          },
        }),
      },
      eventBus,
    ).execute('msg-1')

    expect(job.status).toBe('FAILED')
    expect(job.error).toBe('string failure')
  })

  it('ProcessMessage emits MessageFailed when processor returns FAILED', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.MessageFailed, () => events.push('failed'))
    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')

    const job = await new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'FailProcessor',
          canProcess: () => true,
          process: async () => ({
            messageId: 'msg-1',
            processor: 'FailProcessor',
            status: 'FAILED' as const,
            metadata: {},
            processedAt: new Date(),
            error: 'bad result',
          }),
        }),
      },
      eventBus,
    ).execute('msg-1')

    expect(events).toEqual(['failed'])
    expect(job.status).toBe('FAILED')
  })

  it('executeNext returns null when queue is empty', async () => {
    await expect(createProcessUseCase().executeNext()).resolves.toBeNull()
  })

  it('executeNext dequeues and processes', async () => {
    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')
    const job = await createProcessUseCase().executeNext()
    expect(job?.status).toBe('PROCESSED')
  })

  it('ListProcessingJobs filters by status', async () => {
    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')
    await createProcessUseCase().execute('msg-1')
    const jobs = await new ListProcessingJobsUseCase(jobRepository).execute({ status: 'PROCESSED' })
    expect(jobs).toHaveLength(1)
  })

  it('RequeueMessage throws when job is missing', async () => {
    const requeue = new RequeueMessageUseCase(jobRepository, queue, createProcessUseCase(), eventBus)
    await expect(requeue.execute('missing')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('RequeueMessage reprocesses a failed job', async () => {
    await seedMessage()
    await new EnqueueMessageUseCase(jobRepository, queue, eventBus).execute('msg-1', 'TEXT')

    const failingProcess = new ProcessMessageUseCase(
      jobRepository,
      whatsappRepository,
      queue,
      new MessageTypeClassifier(),
      {
        resolve: () => ({
          name: 'FailingProcessor',
          canProcess: () => true,
          process: async () => {
            throw new Error('first fail')
          },
        }),
      },
      eventBus,
    )
    await failingProcess.execute('msg-1')

    const requeueUseCase = new RequeueMessageUseCase(
      jobRepository,
      queue,
      createProcessUseCase(),
      eventBus,
    )
    const job = await requeueUseCase.execute('msg-1')
    expect(job.status).toBe('PROCESSED')
  })

  it('MessageProcessingPipeline handles WhatsappMessagePersisted when archive enabled', async () => {
    const processed: string[] = []
    eventBus.subscribe(DomainEvents.MessageProcessed, () => processed.push('ok'))
    await seedMessage('msg-pipe', 'TEXT')
    await chatConfigRepository.save(
      WhatsappChatConfig.create({
        chatId: '5511@s.whatsapp.net',
        archiveEnabled: true,
      }),
    )

    const processUseCase = createProcessUseCase()
    const pipeline = new MessageProcessingPipeline(
      eventBus,
      whatsappRepository,
      chatConfigRepository,
      new EnqueueMessageUseCase(jobRepository, queue, eventBus),
      processUseCase,
      new SkipMessageProcessingUseCase(jobRepository, eventBus),
    )
    pipeline.register()

    await eventBus.publish({
      name: DomainEvents.WhatsappMessagePersisted,
      payload: {
        messageId: 'msg-pipe',
        externalMessageId: 'ext-msg-pipe',
        messageType: 'TEXT',
      },
      occurredAt: new Date(),
    })

    expect(processed).toEqual(['ok'])
    const job = await jobRepository.findByMessageId('msg-pipe')
    expect(job?.status).toBe('PROCESSED')
  })

  it('MessageProcessingPipeline skips when archive disabled for chat', async () => {
    const skipped: string[] = []
    eventBus.subscribe(DomainEvents.MessageSkipped, () => skipped.push('skip'))
    await seedMessage('msg-skip', 'TEXT')
    await chatConfigRepository.save(
      WhatsappChatConfig.create({
        chatId: '5511@s.whatsapp.net',
        archiveEnabled: false,
      }),
    )

    const processUseCase = createProcessUseCase()
    const pipeline = new MessageProcessingPipeline(
      eventBus,
      whatsappRepository,
      chatConfigRepository,
      new EnqueueMessageUseCase(jobRepository, queue, eventBus),
      processUseCase,
      new SkipMessageProcessingUseCase(jobRepository, eventBus),
    )
    pipeline.register()

    await eventBus.publish({
      name: DomainEvents.WhatsappMessagePersisted,
      payload: {
        messageId: 'msg-skip',
        externalMessageId: 'ext-msg-skip',
        messageType: 'TEXT',
      },
      occurredAt: new Date(),
    })

    expect(skipped).toEqual(['skip'])
    const job = await jobRepository.findByMessageId('msg-skip')
    expect(job?.status).toBe('SKIPPED')
    expect(job?.processor).toBe('ChatGovernance')
  })
})
