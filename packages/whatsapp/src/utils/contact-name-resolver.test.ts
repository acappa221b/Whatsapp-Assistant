import { describe, expect, it, vi } from 'vitest'
import { ContactNameResolver } from './contact-name-resolver.ts'
import type { RawBaileysMessage } from './baileys-message.util.ts'

describe('ContactNameResolver (RC-06)', () => {
  it('prioritizes contact.name over notify and pushName', () => {
    const resolver = new ContactNameResolver()
    resolver.upsertContact({ id: '5511@s.whatsapp.net', name: 'Maria', notify: 'Mari' })
    resolver.setPushName('5511@s.whatsapp.net', 'M')
    expect(resolver.getBestName('5511@s.whatsapp.net')).toBe('Maria')
  })

  it('falls back notify then verifiedName', () => {
    const resolver = new ContactNameResolver()
    resolver.upsertContact({ id: '5511@s.whatsapp.net', notify: 'João' })
    expect(resolver.getBestName('5511@s.whatsapp.net')).toBe('João')
    resolver.upsertContact({ id: 'biz@lid', verifiedName: 'Empresa X' })
    expect(resolver.getBestName('biz@lid')).toBe('Empresa X')
  })

  it('uses pushName from message for @lid participant', () => {
    const resolver = new ContactNameResolver()
    const raw: RawBaileysMessage = {
      key: {
        id: 'm1',
        remoteJid: 'group@g.us',
        participant: '14852013740151@lid',
        fromMe: false,
      },
      message: { conversation: 'Hi' },
      pushName: 'Alex',
    }
    const names = resolver.resolveForMessage(raw)
    expect(names.senderName).toBe('Alex')
  })

  it('resolves DM chatName and senderName from contact', () => {
    const resolver = new ContactNameResolver()
    resolver.upsertContact({ id: '5511@s.whatsapp.net', name: 'Pedro' })
    const raw: RawBaileysMessage = {
      key: { id: 'm1', remoteJid: '5511@s.whatsapp.net', fromMe: false },
      message: { conversation: 'Olá' },
    }
    const names = resolver.resolveForMessage(raw)
    expect(names.chatName).toBe('Pedro')
    expect(names.senderName).toBe('Pedro')
  })

  it('groupMetadata async enriches chat name', async () => {
    const onResolved = vi.fn()
    const resolver = new ContactNameResolver({
      groupMetadataFetcher: async () => ({ subject: 'Financeiro UNIQUE' }),
      metadataTimeoutMs: 1000,
      onGroupNameResolved: onResolved,
    })
    resolver.enrichGroupMetadataAsync('123@g.us')
    await new Promise((r) => setTimeout(r, 50))
    expect(resolver.getBestName('123@g.us')).toBe('Financeiro UNIQUE')
    expect(onResolved).toHaveBeenCalledWith('123@g.us', 'Financeiro UNIQUE')
  })

  it('resolvePersistableName returns null for JID-like values', () => {
    const resolver = new ContactNameResolver()
    resolver.setPushName('14852013740151@lid', '14852013740151@lid')
    expect(resolver.resolvePersistableName('14852013740151@lid')).toBeNull()
  })

  it('fromMe DM does not persist chatName (avoids own pushName pollution)', () => {
    const resolver = new ContactNameResolver({ ownJid: '5511999999999@s.whatsapp.net' })
    resolver.upsertContact({ id: '5511888888888@s.whatsapp.net', name: 'João' })
    const raw: RawBaileysMessage = {
      key: { id: 'm6', remoteJid: '5511888888888@s.whatsapp.net', fromMe: true },
      message: { conversation: 'Oi' },
      pushName: 'Alexandre Oliveira',
    }
    const names = resolver.resolveForMessage(raw)
    expect(names.chatName).toBeNull()
    expect(names.senderName).toBe('Alexandre Oliveira')
  })
})
