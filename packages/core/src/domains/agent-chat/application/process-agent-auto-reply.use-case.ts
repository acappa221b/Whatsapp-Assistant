import {
  DEFAULT_AGENT_DEFER_PHRASE,
  formatAgentOutbound,
  isLegacyAgentOutboundMessage,
  isProcessedPhotoContent,
  isTranscribedAudioContent,
  PHOTO_PENDING_AGENT_REPLY,
  sanitizeAgentReply,
} from '@finance-ai/shared/utils'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { WhatsappMessage } from '../../whatsapp-message/domain/whatsapp-message.entity'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import { AgentReplyDeduplicator } from './agent-reply-deduplicator'
import { AgentOutboundTracker } from './agent-outbound-tracker'
import { PauseAgentAfterDeferralUseCase } from './handle-human-takeover.use-case'
import {
  shouldDeferInviteBeforeLLM,
  shouldSkipBeforeLLM,
} from './should-auto-reply-to-message'

export type AgentReplyAction = 'reply' | 'skip' | 'defer'

export type AgentReplyInput = {
  incomingMessage: string
  chatId: string
  triggerMessageId?: string
  ownerStyleSamples: string[]
  recentContext: Array<{ role: 'user' | 'assistant'; content: string }>
  hasOwnerHistory: boolean
}

export type AgentReplyOutput = {
  action: AgentReplyAction
  replyText: string
  shouldDefer: boolean
  deferralPhrase?: string
  skipReason?: string
}

export type AgentOutgoingMessage = {
  to: string
  content: string
  metadata?: { source: 'agent-auto-reply'; messageId?: string }
}

export type AgentChatProvider = {
  generateReply(input: AgentReplyInput): Promise<AgentReplyOutput>
}

export type ProcessAgentAutoReplyDeps = {
  chatConfigRepository: WhatsappChatConfigRepository
  messageRepository: WhatsappMessageRepository
  agentChatProvider: AgentChatProvider
  sendMessage: (message: AgentOutgoingMessage) => Promise<void>
  isWhatsappConnected: () => boolean
  hasOpenAIKey: () => boolean
  hasAiProvider?: () => boolean | Promise<boolean>
  pauseAfterDeferral: PauseAgentAfterDeferralUseCase
  agentOutboundTracker: AgentOutboundTracker
  replyDeduplicator: AgentReplyDeduplicator
}

export class ProcessAgentAutoReplyUseCase {
  constructor(private readonly deps: ProcessAgentAutoReplyDeps) {}

  async execute(message: WhatsappMessage): Promise<void> {
    const tracker = this.deps.agentOutboundTracker
    if (
      message.fromMe ||
      isLegacyAgentOutboundMessage(message.content) ||
      tracker.isAgentContent(message.chatId, message.content)
    ) {
      return
    }
    if (message.messageType !== 'TEXT' && message.messageType !== 'AUDIO' && message.messageType !== 'IMAGE') {
      return
    }

    const config = await this.deps.chatConfigRepository.findByChatId(message.chatId)
    if (!config) return
    if (!config.archiveEnabled || !config.agentChatEnabled || config.agentPaused) {
      return
    }

    let incomingText: string | null = null

    if (message.messageType === 'TEXT') {
      incomingText = message.content.trim()
    } else if (message.messageType === 'AUDIO') {
      if (!config.audioProcessingEnabled) return
      if (!isTranscribedAudioContent(message.content)) return
      incomingText = message.content.trim()
    } else if (message.messageType === 'IMAGE') {
      if (!config.photoProcessingEnabled) {
        await this.sendFixedReply(message, config.displayNumber, PHOTO_PENDING_AGENT_REPLY)
        return
      }
      if (!isProcessedPhotoContent(message.content)) return
      incomingText = message.content.trim()
    }

    if (!incomingText) return

    const hasProvider = this.deps.hasAiProvider
      ? await this.deps.hasAiProvider()
      : this.deps.hasOpenAIKey()
    if (!hasProvider) {
      console.warn('[AgentChat] AI provider ausente — auto-reply ignorado', {
        chatId: message.chatId,
        displayNumber: config.displayNumber,
      })
      return
    }

    if (!this.deps.isWhatsappConnected()) {
      console.warn('[AgentChat] WhatsApp desconectado — auto-reply ignorado', {
        chatId: message.chatId,
        displayNumber: config.displayNumber,
      })
      return
    }

    await this.processIncomingText(message, config.displayNumber, incomingText)
  }

  private async processIncomingText(
    message: WhatsappMessage,
    displayNumber: number,
    incomingText: string,
  ): Promise<void> {
    const config = await this.deps.chatConfigRepository.findByChatId(message.chatId)
    if (!config) return

    const recentMessages = await this.deps.messageRepository.findRecentByChatId(message.chatId, {
      limit: 10,
    })
    const recentContext = [...recentMessages]
      .reverse()
      .filter((entry) => entry.id !== message.id)
      .map((entry) => ({
        role: entry.fromMe ? ('assistant' as const) : ('user' as const),
        content: entry.content.trim(),
      }))
      .filter((entry) => entry.content)

    const skipDecision = shouldSkipBeforeLLM(incomingText, recentContext)
    if (skipDecision.skip) {
      console.info('[AgentChat] skip', {
        chatId: message.chatId,
        displayNumber,
        reason: skipDecision.reason,
      })
      return
    }

    if (shouldDeferInviteBeforeLLM(incomingText)) {
      await this.sendDeferral(message, displayNumber, DEFAULT_AGENT_DEFER_PHRASE)
      return
    }

    const ownerMessages = await this.deps.messageRepository.findRecentByChatId(message.chatId, {
      limit: 50,
      fromMe: true,
    })
    const tracker = this.deps.agentOutboundTracker
    const ownerStyleSamples = ownerMessages
      .map((entry) => entry.content.trim())
      .filter(
        (content) =>
          content &&
          !isLegacyAgentOutboundMessage(content) &&
          !tracker.isAgentContent(message.chatId, content),
      )
      .slice(0, 20)

    const result = await this.deps.agentChatProvider.generateReply({
      incomingMessage: incomingText,
      chatId: message.chatId,
      triggerMessageId: message.id,
      ownerStyleSamples,
      recentContext,
      hasOwnerHistory: ownerStyleSamples.length > 0,
    })

    if (result.action === 'skip' || result.skipReason) {
      console.info('[AgentChat] skip', {
        chatId: message.chatId,
        displayNumber,
        reason: result.skipReason ?? 'llm-skip',
      })
      return
    }

    if (result.shouldDefer || result.action === 'defer') {
      const phrase = result.deferralPhrase?.trim() || DEFAULT_AGENT_DEFER_PHRASE
      await this.sendDeferral(message, displayNumber, phrase)
      return
    }

    const sanitized = sanitizeAgentReply(result.replyText.trim())
    if (!sanitized.ok) {
      await this.sendDeferral(message, displayNumber, sanitized.phrase)
      return
    }

    const outbound = formatAgentOutbound(sanitized.text)
    if (await this.deps.replyDeduplicator.isDuplicateReply(message.chatId, outbound)) {
      console.info('[AgentChat] skip', {
        chatId: message.chatId,
        displayNumber,
        reason: 'duplicate-reply',
      })
      return
    }

    tracker.register(message.chatId, outbound)
    await this.deps.sendMessage({
      to: message.chatId,
      content: outbound,
      metadata: { source: 'agent-auto-reply', messageId: message.id },
    })
    console.info('[AgentChat] reply', {
      chatId: message.chatId,
      displayNumber,
      action: 'sent',
    })
  }

  private async sendFixedReply(
    message: WhatsappMessage,
    displayNumber: number,
    phrase: string,
  ): Promise<void> {
    const tracker = this.deps.agentOutboundTracker
    const outbound = formatAgentOutbound(phrase)
    if (await this.deps.replyDeduplicator.isDuplicateReply(message.chatId, outbound)) {
      return
    }
    tracker.register(message.chatId, outbound)
    await this.deps.sendMessage({
      to: message.chatId,
      content: outbound,
      metadata: { source: 'agent-auto-reply', messageId: message.id },
    })
    console.info('[AgentChat] photo-pending-reply', {
      chatId: message.chatId,
      displayNumber,
    })
  }

  private async sendDeferral(
    message: WhatsappMessage,
    displayNumber: number,
    phrase: string,
  ): Promise<void> {
    const tracker = this.deps.agentOutboundTracker
    const outbound = formatAgentOutbound(phrase)
    tracker.register(message.chatId, outbound)
    await this.deps.sendMessage({
      to: message.chatId,
      content: outbound,
      metadata: { source: 'agent-auto-reply', messageId: message.id },
    })
    await this.deps.pauseAfterDeferral.execute(message.chatId)
    console.info('[AgentChat] defer', {
      chatId: message.chatId,
      displayNumber,
      action: 'paused',
    })
  }
}
