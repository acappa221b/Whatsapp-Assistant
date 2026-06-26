import { beforeEach, describe, expect, it } from 'vitest'
import { DomainEvents, InMemoryEventBus } from '@finance-ai/core/events'
import {
  CreateExtractionUseCase,
  ExtractAudioCandidateUseCase,
  ExtractDocumentCandidateUseCase,
  ExtractImageCandidateUseCase,
  ExtractTextCandidateUseCase,
  InMemoryExtractionRepository,
  ListExtractionsUseCase,
  type AIExtractionProvider,
} from '..'

describe('Extraction use cases', () => {
  let repository: InMemoryExtractionRepository
  let eventBus: InMemoryEventBus

  beforeEach(() => {
    repository = new InMemoryExtractionRepository()
    eventBus = new InMemoryEventBus()
  })

  function createProvider(): AIExtractionProvider {
    return {
      extractText: async () => ({
        type: 'EXPENSE_CANDIDATE',
        sourceType: 'TEXT',
        confidence: 0.97,
        data: { description: 'Balas', amount: 4, confidence: 0.97 },
        model: 'mock-gpt',
      }),
      extractImage: async () => ({
        type: 'UNKNOWN',
        sourceType: 'IMAGE',
        confidence: 0,
        data: { reason: 'NOT_IMPLEMENTED' },
        model: 'mock-gpt',
      }),
      extractDocument: async () => ({
        type: 'UNKNOWN',
        sourceType: 'DOCUMENT',
        confidence: 0,
        data: { reason: 'NOT_IMPLEMENTED' },
        model: 'mock-gpt',
      }),
      extractAudio: async () => ({
        type: 'UNKNOWN',
        sourceType: 'AUDIO',
        confidence: 0,
        data: { reason: 'NOT_IMPLEMENTED' },
        model: 'mock-gpt',
      }),
    }
  }

  it('CreateExtraction emits ExtractionCreated', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.ExtractionCreated, () => events.push('created'))

    const extraction = await new CreateExtractionUseCase(repository, eventBus).execute({
      messageId: 'msg-1',
      type: 'EXPENSE_CANDIDATE',
      sourceType: 'TEXT',
      confidence: 0.97,
      data: { description: 'Balas', amount: 4, confidence: 0.97 },
      model: 'mock-gpt',
    })

    expect(events).toEqual(['created'])
    expect(extraction.messageId).toBe('msg-1')
  })

  it('CreateExtraction emits ExtractionRejected for UNKNOWN', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.ExtractionRejected, () => events.push('rejected'))

    await new CreateExtractionUseCase(repository, eventBus).execute({
      messageId: 'msg-1',
      type: 'UNKNOWN',
      sourceType: 'TEXT',
      confidence: 0,
      data: { reason: 'unclear' },
      model: 'mock-gpt',
    })

    expect(events).toEqual(['rejected'])
  })

  it('ExtractTextCandidate persists provider output', async () => {
    const provider = createProvider()
    const extraction = await new ExtractTextCandidateUseCase(
      provider,
      new CreateExtractionUseCase(repository, eventBus),
      eventBus,
    ).execute({
      messageId: 'msg-1',
      text: 'balas 4 reais',
    })

    expect(extraction.type).toBe('EXPENSE_CANDIDATE')
    expect(extraction.model).toBe('mock-gpt')
  })

  it('Extract* use cases wrap provider methods', async () => {
    const provider = createProvider()
    const createUseCase = new CreateExtractionUseCase(repository, eventBus)

    const image = await new ExtractImageCandidateUseCase(provider, createUseCase, eventBus).execute({
      messageId: 'msg-img',
      content: '',
    })
    const document = await new ExtractDocumentCandidateUseCase(provider, createUseCase, eventBus).execute({
      messageId: 'msg-doc',
      content: '',
    })
    const audio = await new ExtractAudioCandidateUseCase(provider, createUseCase, eventBus).execute({
      messageId: 'msg-aud',
      content: '',
    })

    expect(image.type).toBe('UNKNOWN')
    expect(document.type).toBe('UNKNOWN')
    expect(audio.type).toBe('UNKNOWN')
  })

  it('publishes ExtractionFailed when provider throws', async () => {
    const events: string[] = []
    eventBus.subscribe(DomainEvents.ExtractionFailed, () => events.push('failed'))

    const provider: AIExtractionProvider = {
      extractText: async () => {
        throw new Error('provider boom')
      },
      extractImage: async () => ({ type: 'UNKNOWN', sourceType: 'IMAGE', confidence: 0, data: {}, model: 'mock-gpt' }),
      extractDocument: async () => ({ type: 'UNKNOWN', sourceType: 'DOCUMENT', confidence: 0, data: {}, model: 'mock-gpt' }),
      extractAudio: async () => ({ type: 'UNKNOWN', sourceType: 'AUDIO', confidence: 0, data: {}, model: 'mock-gpt' }),
    }

    await expect(
      new ExtractTextCandidateUseCase(
        provider,
        new CreateExtractionUseCase(repository, eventBus),
        eventBus,
      ).execute({
        messageId: 'msg-1',
        text: 'balas 4 reais',
      }),
    ).rejects.toThrow('provider boom')

    expect(events).toEqual(['failed'])
  })

  it('ListExtractions filters by messageId', async () => {
    const createUseCase = new CreateExtractionUseCase(repository, eventBus)
    await createUseCase.execute({
      messageId: 'msg-1',
      type: 'EXPENSE_CANDIDATE',
      sourceType: 'TEXT',
      confidence: 0.97,
      data: { description: 'Balas', amount: 4, confidence: 0.97 },
      model: 'mock-gpt',
    })
    await createUseCase.execute({
      messageId: 'msg-2',
      type: 'REVENUE_CANDIDATE',
      sourceType: 'TEXT',
      confidence: 0.95,
      data: { description: 'Recebimento', amount: 500, confidence: 0.95 },
      model: 'mock-gpt',
    })

    const items = await new ListExtractionsUseCase(repository).execute({ messageId: 'msg-1' })
    expect(items).toHaveLength(1)
  })
})
