import { isLegacyAgentOutboundMessage } from '@finance-ai/shared/utils'
import { isSemanticDuplicate, normalizeForCompare } from '@finance-ai/shared/utils'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { AgentOutboundTracker } from './agent-outbound-tracker'

const AGENT_REPLY_LOOKBACK_MS = 2 * 60 * 60 * 1000

export class AgentReplyDeduplicator {
  constructor(
    private readonly tracker: AgentOutboundTracker,
    private readonly messageRepository: WhatsappMessageRepository,
  ) {}

  async getRecentAgentReplies(chatId: string, limit = 10): Promise<string[]> {
    const fromTracker = this.tracker.getRecentReplies(chatId, limit)
    const cutoff = new Date(Date.now() - AGENT_REPLY_LOOKBACK_MS)
    const persisted = await this.messageRepository.findRecentByChatId(chatId, {
      limit: 50,
      fromMe: true,
    })

    const fromDb = persisted
      .filter(
        (msg) =>
          msg.receivedAt >= cutoff &&
          (isLegacyAgentOutboundMessage(msg.content) ||
            this.tracker.isAgentContent(chatId, msg.content)),
      )
      .map((msg) => msg.content.trim())
      .filter(Boolean)

    const merged: string[] = []
    const seen = new Set<string>()
    for (const text of [...fromTracker, ...fromDb]) {
      const key = normalizeForCompare(text)
      if (!key || seen.has(key)) continue
      seen.add(key)
      merged.push(text)
      if (merged.length >= limit) break
    }
    return merged
  }

  async isDuplicateReply(chatId: string, newReply: string): Promise<boolean> {
    const recent = await this.getRecentAgentReplies(chatId)
    const normalizedNew = normalizeForCompare(newReply)
    if (!normalizedNew) return true

    for (const prior of recent) {
      const normalizedPrior = normalizeForCompare(prior)
      if (normalizedPrior === normalizedNew) return true
      if (isSemanticDuplicate(prior, newReply)) return true
    }
    return false
  }
}
