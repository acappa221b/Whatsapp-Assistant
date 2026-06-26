import { describe, expect, it } from 'vitest'
import { InMemoryEventBus } from '../../../events/index'
import { BackfillWhatsappMessageNamesUseCase } from '../application/backfill-whatsapp-message-names.use-case'
import { StoreWhatsappMessageUseCase } from '../application/whatsapp-message.use-cases'
import { WhatsappMessage } from '../domain/whatsapp-message.entity'
import { InMemoryWhatsappMessageRepository } from '../infrastructure/in-memory-whatsapp-message.repository'

const baseInput = {
  externalMessageId: 'ext-1',
  chatId: 'group@g.us',
  sender: '5511@s.whatsapp.net',
  senderId: '5511@s.whatsapp.net',
  content: 'Hi',
  messageType: 'TEXT' as const,
  rawPayload: {},
  receivedAt: new Date(),
}

describe('RC-06 display names — StoreWhatsappMessageUseCase', () => {
  it('enriches existing message when senderName arrives later', async () => {
    const repo = new InMemoryWhatsappMessageRepository()
    const bus = new InMemoryEventBus()
    const store = new StoreWhatsappMessageUseCase(repo, bus)

    await store.execute({ ...baseInput, senderName: null, chatName: null })
    const updated = await store.execute({
      ...baseInput,
      senderName: 'João',
      chatName: 'Grupo Dev',
    })

    expect(updated.senderName).toBe('João')
    expect(updated.chatName).toBe('Grupo Dev')
  })
})

describe('RC-06 display names — BackfillWhatsappMessageNamesUseCase', () => {
  it('backfills null senderName and chatName', async () => {
    const repo = new InMemoryWhatsappMessageRepository()
    await repo.save(
      WhatsappMessage.create({
        id: 'm1',
        ...baseInput,
        senderName: null,
        chatName: null,
      }),
    )

    const backfill = new BackfillWhatsappMessageNamesUseCase(repo)
    const count = await backfill.execute({
      chatId: 'group@g.us',
      chatName: 'Equipe',
      senderId: '5511@s.whatsapp.net',
      senderName: 'Maria',
    })

    expect(count).toBeGreaterThan(0)
    const message = await repo.findById('m1')
    expect(message?.chatName).toBe('Equipe')
    expect(message?.senderName).toBe('Maria')
  })
})
