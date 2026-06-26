import { describe, expect, it } from 'vitest'
import {
  fallbackChatDisplayName,
  isGenericDisplayName,
  isJidLike,
  isMoreInformativeName,
  resolveChatDisplayName,
  resolveSenderDisplayName,
} from './display-name.ts'

describe('display-name (RC-06)', () => {
  it('detects JID-like strings', () => {
    expect(isJidLike('14852013740151@lid')).toBe(true)
    expect(isJidLike('158304038858972')).toBe(true)
    expect(isJidLike('João')).toBe(false)
  })

  it('resolves chat display name with fallback', () => {
    expect(resolveChatDisplayName('x@g.us', null)).toBe('Grupo')
    expect(resolveChatDisplayName('x@lid', null)).toBe('Chat sem identificação (#x)')
    expect(resolveChatDisplayName('x@lid', 'Família')).toBe('Família')
    expect(resolveChatDisplayName('x@lid', '14852013740151@lid')).toBe(
      'Chat sem identificação (#x)',
    )
  })

  it('resolves sender display name', () => {
    expect(resolveSenderDisplayName(null)).toBe('Contato')
    expect(resolveSenderDisplayName('Maria')).toBe('Maria')
    expect(resolveSenderDisplayName('5511@s.whatsapp.net')).toBe('Contato')
  })

  it('isMoreInformativeName upgrades generic only', () => {
    expect(isMoreInformativeName('João', null)).toBe(true)
    expect(isMoreInformativeName('João', 'Contato')).toBe(true)
    expect(isMoreInformativeName('Contato', 'João')).toBe(false)
    expect(isMoreInformativeName('João', 'Maria')).toBe(false)
  })

  it('fallbackChatDisplayName by suffix', () => {
    expect(fallbackChatDisplayName('a@g.us')).toBe('Grupo')
    expect(fallbackChatDisplayName('a@lid')).toBe('Chat sem identificação (#a)')
  })

  it('isGenericDisplayName', () => {
    expect(isGenericDisplayName('Grupo')).toBe(true)
    expect(isGenericDisplayName('Equipe Dev')).toBe(false)
  })
})
