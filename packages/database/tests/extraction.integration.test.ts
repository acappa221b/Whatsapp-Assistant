import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { InMemoryEventBus } from '@finance-ai/core/events'
import { CreateExtractionUseCase, ListExtractionsUseCase } from '@finance-ai/core/domains/extraction'
import { StoreWhatsappMessageUseCase } from '@finance-ai/core/domains/whatsapp-message'
import { ExtractionPrismaRepository, WhatsappMessagePrismaRepository } from '@finance-ai/database'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database'

describe('ExtractionPrismaRepository integration', () => {
  let db: TestDatabase
  let extractionRepository: ExtractionPrismaRepository
  let whatsappRepository: WhatsappMessagePrismaRepository
  const eventBus = new InMemoryEventBus()

  beforeAll(() => {
    db = createIsolatedTestDatabase()
    extractionRepository = new ExtractionPrismaRepository(db.prisma)
    whatsappRepository = new WhatsappMessagePrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  async function seedMessage(id = 'msg-1') {
    return new StoreWhatsappMessageUseCase(whatsappRepository, eventBus).execute({
      externalMessageId: `ext-${id}`,
      chatId: '5511@s.whatsapp.net',
      sender: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      content: 'balas 4 reais',
      messageType: 'TEXT',
      rawPayload: { key: { id: `ext-${id}` } },
      receivedAt: new Date('2025-06-01T12:00:00Z'),
    })
  }

  it('Create', async () => {
    const message = await seedMessage()
    const extraction = await new CreateExtractionUseCase(extractionRepository, eventBus).execute({
      messageId: message.id,
      type: 'EXPENSE_CANDIDATE',
      sourceType: 'TEXT',
      confidence: 0.97,
      data: { description: 'Balas', amount: 4, confidence: 0.97 },
      model: 'gpt-test',
    })
    expect(extraction.messageId).toBe(message.id)
  })

  it('FindByMessageId', async () => {
    const message = await seedMessage()
    await new CreateExtractionUseCase(extractionRepository, eventBus).execute({
      messageId: message.id,
      type: 'EXPENSE_CANDIDATE',
      sourceType: 'TEXT',
      confidence: 0.97,
      data: { description: 'Balas', amount: 4, confidence: 0.97 },
      model: 'gpt-test',
    })

    const items = await extractionRepository.findByMessageId(message.id)
    expect(items).toHaveLength(1)
  })

  it('List', async () => {
    const message = await seedMessage()
    await new CreateExtractionUseCase(extractionRepository, eventBus).execute({
      messageId: message.id,
      type: 'EXPENSE_CANDIDATE',
      sourceType: 'TEXT',
      confidence: 0.97,
      data: { description: 'Balas', amount: 4, confidence: 0.97 },
      model: 'gpt-test',
    })

    const items = await new ListExtractionsUseCase(extractionRepository).execute({
      type: 'EXPENSE_CANDIDATE',
    })
    expect(items).toHaveLength(1)
  })
})
