import { InMemoryWhatsappMessageRepository } from '@finance-ai/core/domains/whatsapp-message'
import { WhatsappMessage } from '@finance-ai/core/domains/whatsapp-message'
import { describe, expect, it } from 'vitest'

function createMessage(input: {
  id: string
  externalMessageId: string
  chatId: string
  content: string
}) {
  return WhatsappMessage.create({
    id: input.id,
    externalMessageId: input.externalMessageId,
    chatId: input.chatId,
    sender: input.chatId,
    senderId: input.chatId,
    content: input.content,
    messageType: 'TEXT',
    rawPayload: { key: { id: input.externalMessageId } },
    receivedAt: new Date('2025-06-01T12:00:00Z'),
  })
}

describe('WhatsappMessageRepository chatId filter (RC-05)', () => {
  it('returns only messages from chat A when filtering by chatId', async () => {
    const repo = new InMemoryWhatsappMessageRepository()
    await repo.save(
      createMessage({ id: 'a1', externalMessageId: 'ext-a1', chatId: 'chat-a@g.us', content: 'A1' }),
    )
    await repo.save(
      createMessage({ id: 'a2', externalMessageId: 'ext-a2', chatId: 'chat-a@g.us', content: 'A2' }),
    )
    await repo.save(
      createMessage({ id: 'b1', externalMessageId: 'ext-b1', chatId: 'chat-b@g.us', content: 'B1' }),
    )

    const result = await repo.findMany({ chatId: 'chat-a@g.us' }, { page: 1, limit: 50 })
    expect(result.total).toBe(2)
    expect(result.items.every((m) => m.chatId === 'chat-a@g.us')).toBe(true)
  })
})
