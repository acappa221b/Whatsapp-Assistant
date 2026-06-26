import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryEventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import {
  GetWhatsappMessageUseCase,
  InMemoryWhatsappMessageRepository,
  ListWhatsappMessagesUseCase,
  MarkWhatsappMessageProcessedUseCase,
  StoreWhatsappMessageUseCase,
} from '@finance-ai/core/domains/whatsapp-message'
import { NotFoundError } from '@finance-ai/core/domain/errors'

describe('WhatsappMessage domain', () => {
  let repository: InMemoryWhatsappMessageRepository
  let eventBus: InMemoryEventBus

  beforeEach(() => {
    repository = new InMemoryWhatsappMessageRepository()
    eventBus = new InMemoryEventBus()
  })

  const sampleInput = {
    externalMessageId: 'msg-001',
    chatId: '5511999999999@s.whatsapp.net',
    sender: '5511999999999@s.whatsapp.net',
    senderId: '5511999999999@s.whatsapp.net',
    senderName: 'João',
    content: 'Almoço 45 reais',
    messageType: 'TEXT' as const,
    rawPayload: { key: { id: 'msg-001' }, message: { conversation: 'Almoço 45 reais' } },
    receivedAt: new Date('2025-06-01T12:00:00Z'),
  }

  it('StoreWhatsappMessage persists and emits WhatsappMessagePersisted', async () => {
    const published: string[] = []
    eventBus.subscribe(DomainEvents.WhatsappMessagePersisted, () => {
      published.push('persisted')
    })
    const saved = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    expect(saved.content).toBe('Almoço 45 reais')
    expect(saved.rawPayload).toBeTruthy()
    expect(published).toEqual(['persisted'])
  })

  it('StoreWhatsappMessage is idempotent for duplicates', async () => {
    const first = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    const second = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    expect(second.id).toBe(first.id)
  })

  it('StoreWhatsappMessage enriches empty content on duplicate', async () => {
    await new StoreWhatsappMessageUseCase(repository, eventBus).execute({
      ...sampleInput,
      content: '',
      messageType: 'UNKNOWN',
    })
    const enriched = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    expect(enriched.content).toBe('Almoço 45 reais')
    expect(enriched.messageType).toBe('TEXT')
  })

  it('GetWhatsappMessage returns stored message', async () => {
    const saved = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    const found = await new GetWhatsappMessageUseCase(repository).execute(saved.id)
    expect(found.id).toBe(saved.id)
  })

  it('GetWhatsappMessage throws when missing', async () => {
    await expect(new GetWhatsappMessageUseCase(repository).execute('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('ListWhatsappMessages paginates results', async () => {
    await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    await new StoreWhatsappMessageUseCase(repository, eventBus).execute({
      ...sampleInput,
      externalMessageId: 'msg-002',
      content: 'Outra mensagem',
      rawPayload: { key: { id: 'msg-002' } },
    })
    const result = await new ListWhatsappMessagesUseCase(repository).execute({}, { page: 1, limit: 1 })
    expect(result.total).toBe(2)
    expect(result.items).toHaveLength(1)
  })

  it('MarkWhatsappMessageProcessed updates flag and emits event', async () => {
    const published: string[] = []
    eventBus.subscribe(DomainEvents.WhatsappMessageProcessed, () => {
      published.push('processed')
    })
    const saved = await new StoreWhatsappMessageUseCase(repository, new InMemoryEventBus()).execute(
      sampleInput,
    )
    const updated = await new MarkWhatsappMessageProcessedUseCase(repository, eventBus).execute(
      saved.id,
    )
    expect(updated.processed).toBe(true)
    expect(published).toEqual(['processed'])
  })
})
