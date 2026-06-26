import { describe, expect, it } from 'vitest'
import { MessageTypeClassifier } from '../infrastructure/message-type-classifier'
import { DefaultProcessorResolver } from '../infrastructure/default-processor-resolver'
import {
  AudioMessageProcessor,
  DocumentMessageProcessor,
  ImageMessageProcessor,
  TextMessageProcessor,
  UnknownMessageProcessor,
} from '../infrastructure/processors/stub-processors'

describe('MessageTypeClassifier', () => {
  it('returns persisted messageType', () => {
    const classifier = new MessageTypeClassifier()
    expect(classifier.classify('DOCUMENT')).toBe('DOCUMENT')
  })
})

describe('DefaultProcessorResolver', () => {
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

  it('resolves text processor', () => {
    expect(resolver.resolve('TEXT').name).toBe('TextMessageProcessor')
  })

  it('resolves image processor', () => {
    expect(resolver.resolve('IMAGE').name).toBe('ImageMessageProcessor')
  })

  it('falls back to unknown processor', () => {
    expect(resolver.resolve('UNKNOWN').name).toBe('UnknownMessageProcessor')
  })
})

describe('Message processors', () => {
  const input = {
    messageId: 'msg-1',
    externalMessageId: 'ext-msg-1',
    chatId: '5511@s.whatsapp.net',
    messageType: 'TEXT' as const,
    content: 'hello',
  }

  function createMediaDependencies() {
    return {
      createExtractionUseCase: {
        execute: async ({ messageId, sourceType, data }: { messageId: string; sourceType: string; data: Record<string, unknown> }) => ({
          id: `ext-${messageId}`,
          messageId,
          type: 'UNKNOWN' as const,
          sourceType,
          confidence: 0,
          data,
          processingTimeMs: 0,
          tokensInput: null,
          tokensOutput: null,
          storagePath: null,
          model: 'system-media-validator',
          createdAt: new Date(),
        }),
      },
      mediaDownloader: {
        downloadImage: async () => {
          throw new Error('NOT USED')
        },
        downloadDocument: async () => {
          throw new Error('NOT USED')
        },
      },
    }
  }

  it('TextMessageProcessor creates extraction metadata', async () => {
    const result = await new TextMessageProcessor({
      execute: async ({ messageId }) => ({
        id: `ext-${messageId}`,
        messageId,
        type: 'EXPENSE_CANDIDATE',
        confidence: 0.97,
        data: { description: 'Balas', amount: 4, confidence: 0.97 },
        model: 'mock-gpt',
        createdAt: new Date(),
      }),
    }).process(input)
    expect(result.status).toBe('PROCESSED')
    expect(result.metadata).toMatchObject({ extractionType: 'EXPENSE_CANDIDATE' })
  })

  it('ImageMessageProcessor handles IMAGE', async () => {
    const dependencies = createMediaDependencies()
    const processor = new ImageMessageProcessor(
      {
        execute: async ({ messageId }) => ({
          id: `ext-${messageId}`,
          messageId,
          type: 'UNKNOWN',
          sourceType: 'IMAGE',
          confidence: 0,
          data: { reason: 'noop' },
          processingTimeMs: 5,
          tokensInput: 1,
          tokensOutput: 1,
          storagePath: 'receipt.jpg',
          model: 'mock-gpt',
          createdAt: new Date(),
        }),
      },
      dependencies.createExtractionUseCase,
      {
        ...dependencies.mediaDownloader,
        downloadImage: async () => ({
          mimeType: 'image/jpeg',
          fileName: 'receipt.jpg',
          fileSize: 123,
          storagePath: 'receipt.jpg',
          absolutePath: 'C:/tmp/receipt.jpg',
        }),
      },
    )
    expect(processor.canProcess('IMAGE')).toBe(true)
    const result = await processor.process({
      ...input,
      messageType: 'IMAGE',
      mimeType: 'image/jpeg',
    })
    expect(result.processor).toBe('ImageMessageProcessor')
    expect(result.status).toBe('SKIPPED')
    expect(result.metadata).toMatchObject({ storagePath: 'receipt.jpg', tokensInput: 1 })
  })

  it('DocumentMessageProcessor handles DOCUMENT', async () => {
    const dependencies = createMediaDependencies()
    const result = await new DocumentMessageProcessor(
      {
        execute: async ({ messageId }) => ({
          id: `ext-${messageId}`,
          messageId,
          type: 'UNKNOWN',
          sourceType: 'DOCUMENT',
          confidence: 0,
          data: { reason: 'noop' },
          processingTimeMs: 7,
          tokensInput: 2,
          tokensOutput: 3,
          storagePath: 'invoice.pdf',
          model: 'mock-gpt',
          createdAt: new Date(),
        }),
      },
      dependencies.createExtractionUseCase,
      {
        ...dependencies.mediaDownloader,
        downloadDocument: async () => ({
          mimeType: 'application/pdf',
          fileName: 'invoice.pdf',
          fileSize: 456,
          storagePath: 'invoice.pdf',
          absolutePath: 'C:/tmp/invoice.pdf',
        }),
      },
    ).process({
      ...input,
      messageType: 'DOCUMENT',
      mimeType: 'application/pdf',
    })
    expect(result.processor).toBe('DocumentMessageProcessor')
    expect(result.status).toBe('SKIPPED')
    expect(result.metadata).toMatchObject({ storagePath: 'invoice.pdf', tokensOutput: 3 })
  })

  it('AudioMessageProcessor handles AUDIO', async () => {
    const result = await new AudioMessageProcessor().process({ ...input, messageType: 'AUDIO' })
    expect(result.processor).toBe('AudioMessageProcessor')
    expect(result.error).toBe('NOT_IMPLEMENTED')
  })

  it('UnknownMessageProcessor returns SKIPPED', async () => {
    const result = await new UnknownMessageProcessor().process({
      ...input,
      messageType: 'UNKNOWN',
    })
    expect(result.status).toBe('SKIPPED')
  })
})
