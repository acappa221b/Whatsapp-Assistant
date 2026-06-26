import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { WhatsappMessage } from '../domain/whatsapp-message.entity'

describe('WhatsappMessage entity', () => {
  const baseInput = {
    id: 'wa-1',
    externalMessageId: 'ext-1',
    chatId: '5511@s.whatsapp.net',
    sender: '5511@s.whatsapp.net',
    senderId: '5511@s.whatsapp.net',
    content: '  hello  ',
    messageType: 'TEXT' as const,
    rawPayload: { key: { id: 'ext-1' } },
    receivedAt: new Date('2025-06-01T12:00:00Z'),
    now: new Date('2025-06-01T10:00:00Z'),
  }

  it('create trims content and sets processed false', () => {
    const message = WhatsappMessage.create(baseInput)
    expect(message.content).toBe('hello')
    expect(message.processed).toBe(false)
    expect(message.mediaUrl).toBeNull()
  })

  it('create accepts mediaUrl', () => {
    const message = WhatsappMessage.create({ ...baseInput, mediaUrl: '/uploads/x.jpg' })
    expect(message.mediaUrl).toBe('/uploads/x.jpg')
  })

  it('create rejects empty externalMessageId', () => {
    expect(() => WhatsappMessage.create({ ...baseInput, externalMessageId: '  ' })).toThrow(
      ValidationError,
    )
  })

  it('create rejects empty chatId', () => {
    expect(() => WhatsappMessage.create({ ...baseInput, chatId: '' })).toThrow(ValidationError)
  })

  it('create rejects invalid message type', () => {
    expect(() =>
      WhatsappMessage.create({ ...baseInput, messageType: 'INVALID' as 'TEXT' }),
    ).toThrow(ValidationError)
  })

  it('markProcessed sets flag', () => {
    const message = WhatsappMessage.create(baseInput)
    const processed = message.markProcessed()
    expect(processed.processed).toBe(true)
  })

  it('markProcessed rejects already processed', () => {
    const message = WhatsappMessage.create(baseInput).markProcessed()
    expect(() => message.markProcessed()).toThrow(ValidationError)
  })
})
