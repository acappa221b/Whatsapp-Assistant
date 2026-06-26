import { describe, expect, it } from 'vitest'
import { ChatContactResolver } from './chat-contact-resolver'
import type { RawBaileysMessage } from './baileys-message.util'

const OWN_JID = '5511999999999@s.whatsapp.net'
const OTHER_JID = '5511888888888@s.whatsapp.net'

function dmRaw(input: Partial<RawBaileysMessage['key']> & { pushName?: string }): RawBaileysMessage {
  return {
    key: {
      id: 'm1',
      remoteJid: OTHER_JID,
      fromMe: false,
      ...input,
    },
    message: { conversation: 'Olá' },
    pushName: input.pushName,
  }
}

describe('ChatContactResolver (RC-06F)', () => {
  it('DM incoming uses pushName as chat and sender', () => {
    const resolver = new ChatContactResolver({ ownJid: OWN_JID })
    const names = resolver.resolveForMessage(dmRaw({ pushName: 'João' }))
    expect(names.chatName).toBe('João')
    expect(names.senderName).toBe('João')
  })

  it('DM fromMe does not use pushName as chatName', () => {
    const resolver = new ChatContactResolver({
      ownJid: OWN_JID,
      getContactName: (jid) => (jid === OTHER_JID ? 'João' : 'Alexandre Oliveira'),
    })
    const raw: RawBaileysMessage = {
      key: { id: 'm2', remoteJid: OTHER_JID, fromMe: true },
      message: { conversation: 'Oi' },
      pushName: 'Alexandre Oliveira',
    }
    const names = resolver.resolveForMessage(raw)
    expect(names.chatName).toBe('João')
    expect(names.senderName).toBe('Alexandre Oliveira')
  })

  it('self-chat may use own pushName', () => {
    const resolver = new ChatContactResolver({ ownJid: OWN_JID })
    const raw: RawBaileysMessage = {
      key: { id: 'm3', remoteJid: OWN_JID, fromMe: true },
      message: { conversation: 'Lembrete' },
      pushName: 'Alexandre Oliveira',
    }
    const names = resolver.resolveForMessage(raw)
    expect(names.chatName).toBe('Alexandre Oliveira')
    expect(names.senderName).toBe('Alexandre Oliveira')
  })

  it('group uses contact lookup for chatName', () => {
    const resolver = new ChatContactResolver({
      getContactName: (jid) => (jid === 'group@g.us' ? 'Financeiro' : 'Maria'),
    })
    const raw: RawBaileysMessage = {
      key: {
        id: 'm4',
        remoteJid: 'group@g.us',
        participant: '5511@s.whatsapp.net',
        fromMe: false,
      },
      message: { conversation: 'Ok' },
      pushName: 'Maria',
    }
    const names = resolver.resolveForMessage(raw)
    expect(names.chatName).toBe('Financeiro')
    expect(names.senderName).toBe('Maria')
  })

  it('shouldPersistChatName blocks fromMe DM chatName (any value)', () => {
    const resolver = new ChatContactResolver({ ownJid: OWN_JID })
    const raw: RawBaileysMessage = {
      key: { id: 'm5', remoteJid: OTHER_JID, fromMe: true },
      message: { conversation: 'x' },
      pushName: 'Alexandre Oliveira',
    }
    expect(resolver.shouldPersistChatName(raw, 'Alexandre Oliveira')).toBe(false)
    expect(resolver.shouldPersistChatName(raw, 'João')).toBe(false)
  })

  it('shouldPersistChatName allows incoming DM chatName', () => {
    const resolver = new ChatContactResolver({ ownJid: OWN_JID })
    const raw = dmRaw({ pushName: 'João' })
    expect(resolver.shouldPersistChatName(raw, 'João')).toBe(true)
  })
})
