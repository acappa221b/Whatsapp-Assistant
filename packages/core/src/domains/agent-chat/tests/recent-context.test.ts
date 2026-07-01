import { describe, expect, it } from 'vitest'
import { WhatsappMessage } from '../../whatsapp-message/domain/whatsapp-message.entity'
import { buildRecentContext, mapRecentRole } from '../application/process-agent-auto-reply.use-case'

describe('mapRecentRole / buildRecentContext', () => {
  it('maps inbound as user and agent outbound as assistant', () => {
    const inbound = WhatsappMessage.create({
      id: 'in',
      externalMessageId: 'ext-in',
      chatId: '5511@s.whatsapp.net',
      sender: 'Contact',
      senderId: '5522@s.whatsapp.net',
      content: 'oi',
      messageType: 'TEXT',
      rawPayload: {},
      fromMe: false,
      receivedAt: new Date(),
    })
    const agent = WhatsappMessage.create({
      id: 'agent',
      externalMessageId: 'ext-agent',
      chatId: '5511@s.whatsapp.net',
      sender: 'Eu',
      senderId: '5511@s.whatsapp.net',
      content: 'tudo certo',
      messageType: 'TEXT',
      rawPayload: {},
      fromMe: true,
      sourceAgent: true,
      receivedAt: new Date(),
    })
    const ownerManual = WhatsappMessage.create({
      id: 'owner',
      externalMessageId: 'ext-owner',
      chatId: '5511@s.whatsapp.net',
      sender: 'Eu',
      senderId: '5511@s.whatsapp.net',
      content: 'beleza, avisa quando finalizar',
      messageType: 'TEXT',
      rawPayload: {},
      fromMe: true,
      sourceAgent: false,
      receivedAt: new Date(),
    })

    expect(mapRecentRole(inbound)).toBe('user')
    expect(mapRecentRole(agent)).toBe('assistant')
    expect(mapRecentRole(ownerManual)).toBeNull()

    const context = buildRecentContext([inbound, ownerManual, agent])
    expect(context).toEqual([
      { role: 'assistant', content: 'tudo certo' },
      { role: 'user', content: 'oi' },
    ])
  })
})
