import { describe, expect, it } from 'vitest'
import { formatAgentOutbound, isLegacyAgentOutboundMessage } from './agent-message-format'

describe('formatAgentOutbound', () => {
  it('returns trimmed text without prefix', () => {
    expect(formatAgentOutbound('tudo bem')).toBe('tudo bem')
    expect(formatAgentOutbound('  oi  ')).toBe('oi')
    expect(formatAgentOutbound('disse "oi"')).toBe('disse "oi"')
  })

  it('detects legacy prefixed agent messages', () => {
    expect(isLegacyAgentOutboundMessage('Teste IA: "oi"')).toBe(true)
    expect(isLegacyAgentOutboundMessage('oi')).toBe(false)
  })
})
