import { describe, expect, it } from 'vitest'
import { isAllowedWhatsappOrigin } from './chat-origin-filter'

const MONITORED_GROUP = '120363123456789012@g.us'

describe('chat-origin-filter', () => {
  it('accepts all origins when monitored chat id is empty', () => {
    expect(isAllowedWhatsappOrigin('5511999999999@s.whatsapp.net', '')).toBe(true)
    expect(isAllowedWhatsappOrigin(undefined, '')).toBe(true)
  })

  it('accepts only the configured group remoteJid (@g.us)', () => {
    expect(isAllowedWhatsappOrigin(MONITORED_GROUP, MONITORED_GROUP)).toBe(true)
    expect(isAllowedWhatsappOrigin('155650134945974@lid', MONITORED_GROUP)).toBe(false)
    expect(isAllowedWhatsappOrigin('5511999999999@s.whatsapp.net', MONITORED_GROUP)).toBe(false)
  })

  it('rejects missing remoteJid when filter is active', () => {
    expect(isAllowedWhatsappOrigin(undefined, MONITORED_GROUP)).toBe(false)
    expect(isAllowedWhatsappOrigin('', MONITORED_GROUP)).toBe(false)
  })

  it('trims whitespace before comparing jids', () => {
    expect(isAllowedWhatsappOrigin(` ${MONITORED_GROUP} `, MONITORED_GROUP)).toBe(true)
  })
})
