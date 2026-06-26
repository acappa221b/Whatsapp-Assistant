import { describe, expect, it } from 'vitest'
import { mapBaileysMessage } from './baileys-message.util.ts'
import { ContactNameResolver } from './contact-name-resolver.ts'

describe('mapBaileysMessage (RC-04)', () => {
  it('maps text messages with rawPayload', () => {
    const mapped = mapBaileysMessage({
      key: { id: 'abc', remoteJid: '5511@s.whatsapp.net', fromMe: false },
      message: { conversation: 'Olá' },
      pushName: 'João',
      messageTimestamp: 1_718_000_000,
    })
    expect(mapped).toMatchObject({
      externalMessageId: 'abc',
      chatId: '5511@s.whatsapp.net',
      senderId: '5511@s.whatsapp.net',
      senderName: 'João',
      messageType: 'TEXT',
      content: 'Olá',
      fromMe: false,
    })
    expect(mapped.rawPayload).toBeTruthy()
  })

  it('unwraps ephemeral text messages', () => {
    const mapped = mapBaileysMessage({
      key: { id: 'eph-1', remoteJid: '5511@lid', fromMe: false },
      message: { ephemeralMessage: { message: { conversation: 'Mensagem temporária' } } },
      messageTimestamp: 1_718_000_000,
    })
    expect(mapped.messageType).toBe('TEXT')
    expect(mapped.content).toBe('Mensagem temporária')
  })

  it('does not classify empty extendedTextMessage shell as TEXT', () => {
    const mapped = mapBaileysMessage({
      key: { id: 'empty-ext-1', remoteJid: '5511@lid', fromMe: false },
      message: { extendedTextMessage: {} },
      messageTimestamp: 1_718_000_000,
    })
    expect(mapped.messageType).toBe('UNKNOWN')
  })

  it('maps video as VIDEO not IMAGE', () => {
    const mapped = mapBaileysMessage({
      key: { id: 'vid-1', remoteJid: '5511@s.whatsapp.net', fromMe: false },
      message: { videoMessage: { caption: 'Vídeo', mimetype: 'video/mp4' } },
      messageTimestamp: 1_718_000_000,
    })
    expect(mapped.messageType).toBe('VIDEO')
  })

  it('maps sticker as STICKER', () => {
    const mapped = mapBaileysMessage({
      key: { id: 'stk-1', remoteJid: '5511@s.whatsapp.net', fromMe: false },
      message: { stickerMessage: {} } as never,
      messageTimestamp: 1_718_000_000,
    })
    expect(mapped.messageType).toBe('STICKER')
  })

  it('never returns null for fromMe messages', () => {
    const mapped = mapBaileysMessage({
      key: { id: 'out-1', remoteJid: '5511@s.whatsapp.net', fromMe: true },
      message: { conversation: 'Olá' },
    })
    expect(mapped).not.toBeNull()
    expect(mapped.fromMe).toBe(true)
  })

  it('synthesizes id when missing', () => {
    const mapped = mapBaileysMessage({
      key: { id: '', remoteJid: '5511@s.whatsapp.net', fromMe: false },
      message: { conversation: 'Olá' },
    })
    expect(mapped.externalMessageId.startsWith('synthetic-')).toBe(true)
  })

  it('uses participant as senderId in groups', () => {
    const mapped = mapBaileysMessage({
      key: {
        id: 'abc',
        remoteJid: 'group@g.us',
        participant: '5511@s.whatsapp.net',
        fromMe: false,
      },
      message: { conversation: 'Hi' },
      messageTimestamp: 1_718_000_000,
    })
    expect(mapped.senderId).toBe('5511@s.whatsapp.net')
  })

  it('fills chatName and senderName when resolver provided (RC-06)', () => {
    const resolver = new ContactNameResolver()
    resolver.upsertContact({ id: 'group@g.us', name: 'Equipe Dev' })
    resolver.upsertContact({ id: '5511@s.whatsapp.net', name: 'Maria' })
    const mapped = mapBaileysMessage(
      {
        key: {
          id: 'g1',
          remoteJid: 'group@g.us',
          participant: '5511@s.whatsapp.net',
          fromMe: false,
        },
        message: { conversation: 'Olá grupo' },
        pushName: 'Maria',
      },
      { resolver },
    )
    expect(mapped.chatName).toBe('Equipe Dev')
    expect(mapped.senderName).toBe('Maria')
  })
})
