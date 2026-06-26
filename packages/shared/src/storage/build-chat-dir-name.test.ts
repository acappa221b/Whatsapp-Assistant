import { describe, expect, it } from 'vitest'
import { buildChatDirName } from './build-chat-dir-name.ts'

describe('buildChatDirName', () => {
  it('slugifies accents and special characters', () => {
    expect(buildChatDirName('Ferramentaria Apcom', '120363421372276062@g.us')).toMatch(
      /^ferramentaria-apcom_/,
    )
  })

  it('uses chat fallback for empty display name', () => {
    expect(buildChatDirName('', '5511999999999@s.whatsapp.net')).toMatch(/^chat_/)
  })

  it('includes unique suffix from chatId', () => {
    const a = buildChatDirName('Tom', '5511999999999@s.whatsapp.net')
    const b = buildChatDirName('Tom', '5511888888888@s.whatsapp.net')
    expect(a).not.toBe(b)
  })
})
