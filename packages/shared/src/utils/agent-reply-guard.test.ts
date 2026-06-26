import { describe, expect, it } from 'vitest'
import { containsInviteOrAcceptance, sanitizeAgentReply } from '@finance-ai/shared/utils'

describe('agent-reply-guard', () => {
  it('detects invites and acceptances', () => {
    expect(containsInviteOrAcceptance('vamos marcar amanhã')).toBe(true)
    expect(containsInviteOrAcceptance('combinado então')).toBe(true)
    expect(containsInviteOrAcceptance('tudo certo, obrigado')).toBe(false)
  })

  it('forces defer on invite-like replies', () => {
    const result = sanitizeAgentReply('pode ser às 15h')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.forceDefer).toBe(true)
  })
})
