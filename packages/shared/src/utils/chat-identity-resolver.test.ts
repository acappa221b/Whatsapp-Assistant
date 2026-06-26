import { describe, expect, it } from 'vitest'
import { ChatIdentityResolver } from './chat-identity-resolver'

describe('ChatIdentityResolver (RC-07)', () => {
  const ownJid = '5511999999999@s.whatsapp.net'
  const otherJid = '5511888888888@s.whatsapp.net'

  it('rejects own display name on DM chat title', () => {
    const resolver = new ChatIdentityResolver(ownJid, 'Alexandre Oliveira')
    expect(
      resolver.resolveChatName({
        chatId: otherJid,
        chatName: 'Alexandre Oliveira',
        peerName: 'João',
      }),
    ).toBe('João')
  })

  it('allows own name on self-chat', () => {
    const resolver = new ChatIdentityResolver(ownJid, 'Alexandre Oliveira')
    expect(
      resolver.resolveChatName({
        chatId: ownJid,
        chatName: 'Alexandre Oliveira',
      }),
    ).toBe('Alexandre Oliveira')
  })

  it('falls back for group without name', () => {
    const resolver = new ChatIdentityResolver(ownJid, 'Alex')
    expect(resolver.resolveChatName({ chatId: '123@g.us', chatName: null })).toBe('Grupo')
  })
})
