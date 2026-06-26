import { beforeEach, describe, expect, it } from 'vitest'
import { DomainEvents, InMemoryEventBus } from '@finance-ai/core/events'
import {
  InMemoryWhatsappMessageRepository,
  StoreWhatsappMessageUseCase,
} from '@finance-ai/core/domains/whatsapp-message'
import {
  EnsureWhatsappChatDiscoveredUseCase,
  InMemoryWhatsappChatConfigRepository,
} from '@finance-ai/core/domains/whatsapp-chat-config'
import { WhatsappMessagePipeline } from '@finance-ai/whatsapp/pipeline/whatsapp-message.pipeline'

describe('WhatsappMessagePipeline', () => {
  let eventBus: InMemoryEventBus
  let repository: InMemoryWhatsappMessageRepository
  let chatConfigRepository: InMemoryWhatsappChatConfigRepository

  beforeEach(() => {
    eventBus = new InMemoryEventBus()
    repository = new InMemoryWhatsappMessageRepository()
    chatConfigRepository = new InMemoryWhatsappChatConfigRepository()
  })

  function createPipeline() {
    return new WhatsappMessagePipeline(
      eventBus,
      new EnsureWhatsappChatDiscoveredUseCase(chatConfigRepository),
      new StoreWhatsappMessageUseCase(repository, eventBus),
    )
  }

  const basePayload = {
    externalMessageId: 'ext-1',
    chatId: '5511@s.whatsapp.net',
    sender: '5511@s.whatsapp.net',
    senderId: '5511@s.whatsapp.net',
    content: 'Oi',
    messageType: 'TEXT' as const,
    rawPayload: { key: { id: 'ext-1' }, message: { conversation: 'Oi' } },
    receivedAt: new Date(),
  }

  it('persists on WhatsappMessageReceived and emits persisted event', async () => {
    const persisted: string[] = []
    eventBus.subscribe(DomainEvents.WhatsappMessagePersisted, () => persisted.push('ok'))
    const pipeline = createPipeline()
    pipeline.register()

    await eventBus.publish({
      name: DomainEvents.WhatsappMessageReceived,
      payload: basePayload,
      occurredAt: new Date(),
    })

    expect(persisted).toEqual(['ok'])
    const stored = await repository.findByExternalMessageId('ext-1')
    expect(stored?.content).toBe('Oi')
    const chatConfig = await chatConfigRepository.findByChatId('5511@s.whatsapp.net')
    expect(chatConfig?.archiveEnabled).toBe(false)
  })

  it('does not fail on duplicate WhatsappMessageReceived', async () => {
    const failed: string[] = []
    eventBus.subscribe(DomainEvents.WhatsappMessageFailed, () => failed.push('fail'))
    const storeUseCase = new StoreWhatsappMessageUseCase(repository, eventBus)
    const pipeline = new WhatsappMessagePipeline(
      eventBus,
      new EnsureWhatsappChatDiscoveredUseCase(chatConfigRepository),
      storeUseCase,
    )
    pipeline.register()

    const payload = {
      ...basePayload,
      externalMessageId: 'ext-dup',
      rawPayload: { key: { id: 'ext-dup' } },
    }
    await eventBus.publish({
      name: DomainEvents.WhatsappMessageReceived,
      payload,
      occurredAt: new Date(),
    })
    await eventBus.publish({
      name: DomainEvents.WhatsappMessageReceived,
      payload,
      occurredAt: new Date(),
    })

    expect(failed).toHaveLength(0)
  })
})
