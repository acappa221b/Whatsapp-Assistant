import { InMemoryEventBus } from '@finance-ai/core/events'
import {
  GetWhatsappMessageUseCase,
  ListWhatsappMessagesUseCase,
  MarkWhatsappMessageProcessedUseCase,
  StoreWhatsappMessageUseCase,
} from '@finance-ai/core/domains/whatsapp-message'
import { WhatsappMessagePrismaRepository } from '@finance-ai/database'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database'

describe('WhatsappMessagePrismaRepository integration', () => {
  let db: TestDatabase
  let repository: WhatsappMessagePrismaRepository
  const eventBus = new InMemoryEventBus()

  beforeAll(() => {
    db = createIsolatedTestDatabase()
    repository = new WhatsappMessagePrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  const sampleInput = {
    externalMessageId: 'ext-int-1',
    chatId: '5511@s.whatsapp.net',
    sender: '5511@s.whatsapp.net',
    senderId: '5511@s.whatsapp.net',
    content: 'Mensagem integração',
    messageType: 'TEXT' as const,
    rawPayload: { key: { id: 'ext-int-1' } },
    receivedAt: new Date('2025-06-01T12:00:00Z'),
  }

  it('Create', async () => {
    const saved = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    expect(saved.content).toBe('Mensagem integração')
  })

  it('GetById', async () => {
    const saved = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    const found = await new GetWhatsappMessageUseCase(repository).execute(saved.id)
    expect(found.externalMessageId).toBe(sampleInput.externalMessageId)
  })

  it('List', async () => {
    await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    await new StoreWhatsappMessageUseCase(repository, eventBus).execute({
      ...sampleInput,
      externalMessageId: 'ext-int-2',
    })
    const result = await new ListWhatsappMessagesUseCase(repository).execute({}, { page: 1, limit: 10 })
    expect(result.total).toBe(2)
  })

  it('Mark processed', async () => {
    const saved = await new StoreWhatsappMessageUseCase(repository, eventBus).execute(sampleInput)
    const updated = await new MarkWhatsappMessageProcessedUseCase(repository, eventBus).execute(saved.id)
    expect(updated.processed).toBe(true)
  })
})
