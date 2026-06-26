import { describe, expect, it, vi } from 'vitest'
import { AgentOutboundTracker } from '../application/agent-outbound-tracker'
import { AgentReplyDeduplicator } from '../application/agent-reply-deduplicator'
import { InMemoryWhatsappMessageRepository } from '../../whatsapp-message/infrastructure/in-memory-whatsapp-message.repository'

describe('AgentReplyDeduplicator', () => {
  it('blocks exact duplicate replies', async () => {
    const tracker = new AgentOutboundTracker()
    const repo = new InMemoryWhatsappMessageRepository()
    const dedup = new AgentReplyDeduplicator(tracker, repo)
    const chatId = '5511@s.whatsapp.net'
    const reply = 'beleza, avisa quando finalizar?'

    tracker.register(chatId, reply)
    expect(await dedup.isDuplicateReply(chatId, reply)).toBe(true)
    expect(await dedup.isDuplicateReply(chatId, 'outra frase nova')).toBe(false)
  })
})
