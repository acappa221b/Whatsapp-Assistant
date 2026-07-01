import { getSharedAppLogger } from '@finance-ai/shared/logging'
import type { ComposeAgentPromptUseCase } from '../../ai-training/application/compose-agent-prompt.use-case'
import type { SearchKnowledgeUseCase } from '../../ai-training/application/search-knowledge.use-case'
import type { AiPersonaProfile } from '../../ai-training/domain/ai-persona'
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
import { recordAgentReplyDecision } from './agent-reply-diagnostics'
import { PauseAgentAfterDeferralUseCase } from './handle-human-takeover.use-case'
import {
  shouldDeferInviteBeforeLLM,
  shouldSkipBeforeLLM,
} from './should-auto-reply-to-message'

export function mapRecentRole(entry: WhatsappMessage): 'user' | 'assistant' | null {
  if (!entry.fromMe) return 'user'
  if (entry.sourceAgent) return 'assistant'
  return null
}

export function buildRecentContext(
  recentMessages: WhatsappMessage[],
  excludeMessageId?: string,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return [...recentMessages]
    .reverse()
    .filter((entry) => entry.id !== excludeMessageId)
    .map((entry) => {
      const role = mapRecentRole(entry)
      if (!role) return null
      const content = entry.content.trim()
      if (!content) return null
      return { role, content }
    })
    .filter((entry): entry is { role: 'user' | 'assistant'; content: string } => entry !== null)
}

export type AgentReplyAction = 'reply' | 'skip' | 'defer'

export type AgentReplyInput = {
  incomingMessage: string
  chatId: string
  triggerMessageId?: string
  ownerStyleSamples: string[]
  recentContext: Array<{ role: 'user' | 'assistant'; content: string }>
  hasOwnerHistory: boolean
  systemPrompt?: string
  /** Pre-LLM gates passed — prefer reply unless truly impossible */
  gatesPassed?: boolean
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

export function stripMediaPrefix(text: string): string {
  return text.replace(/^\[(ÁUDIO|AUDIO|FOTO)\]\s*/i, '').trim()
}

export type ProcessAgentAutoReplyDeps = {
  chatConfigRepository: WhatsappChatConfigRepository
  messageRepository: WhatsappMessageRepository
  agentChatProvider: AgentChatProvider
  sendMessage: (message: AgentOutgoingMessage) => Promise<void>
  persistOutbound?: (input: {
    chatId: string
    content: string
    triggerMessageId?: string
  }) => Promise<void>
  isWhatsappConnected: () => boolean
  hasOpenAIKey: () => boolean
  hasAiProvider?: () => boolean | Promise<boolean>
  pauseAfterDeferral: PauseAgentAfterDeferralUseCase
  agentOutboundTracker: AgentOutboundTracker
  replyDeduplicator: AgentReplyDeduplicator
  composeAgentPrompt?: ComposeAgentPromptUseCase
  searchKnowledge?: SearchKnowledgeUseCase
  getPersona?: () => Promise<AiPersonaProfile>
  getCompanyName?: () => Promise<string | undefined>
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
    if (!config) {
      this.logSkip(message.chatId, undefined, 'no-config')
      return
    }
    if (!config.archiveEnabled) {
      this.logSkip(message.chatId, config.displayNumber, 'archive-disabled')
      return
    }
    if (!config.agentChatEnabled) {
      this.logSkip(message.chatId, config.displayNumber, 'agent-disabled')
      return
    }
    if (config.agentPaused) {
      this.logSkip(message.chatId, config.displayNumber, 'agent-paused', {
        agentPausedReason: config.agentPausedReason ?? null,
      })
      return
    }

    let incomingText: string | null = null

    if (message.messageType === 'TEXT') {
      incomingText = message.content.trim()
    } else if (message.messageType === 'AUDIO') {
      if (!config.audioProcessingEnabled) {
        this.logSkip(message.chatId, config.displayNumber, 'audio-processing-disabled')
        return
      }
      if (!isTranscribedAudioContent(message.content)) {
        this.logSkip(message.chatId, config.displayNumber, 'not-transcribed-yet')
        return
      }
      incomingText = message.content.trim()
    } else if (message.messageType === 'IMAGE') {
      if (!config.photoProcessingEnabled) {
        await this.sendFixedReply(message, config.displayNumber, PHOTO_PENDING_AGENT_REPLY)
        return
      }
      if (!isProcessedPhotoContent(message.content)) {
        this.logSkip(message.chatId, config.displayNumber, 'not-processed-yet')
        return
      }
      incomingText = message.content.trim()
    }

    if (!incomingText) return

    const hasProvider = this.deps.hasAiProvider
      ? await this.deps.hasAiProvider()
      : this.deps.hasOpenAIKey()
    if (!hasProvider) {
      this.logSkip(message.chatId, config.displayNumber, 'no-ai-provider')
      return
    }

    if (!this.deps.isWhatsappConnected()) {
      this.logSkip(message.chatId, config.displayNumber, 'whatsapp-disconnected')
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
    const recentContext = buildRecentContext(recentMessages, message.id)

    const incomingForSkip = stripMediaPrefix(incomingText)
    const skipDecision = shouldSkipBeforeLLM(incomingForSkip, recentContext)
    if (skipDecision.skip) {
      this.logSkip(message.chatId, displayNumber, skipDecision.reason)
      return
    }

    if (shouldDeferInviteBeforeLLM(incomingForSkip)) {
      await this.sendDeferral(message, displayNumber, DEFAULT_AGENT_DEFER_PHRASE)
      return
    }

    const ownerMessages = await this.deps.messageRepository.findRecentByChatId(message.chatId, {
      limit: 50,
      fromMe: true,
    })
    const tracker = this.deps.agentOutboundTracker
    let ownerStyleSamples = ownerMessages
      .map((entry) => entry.content.trim())
      .filter(
        (content) =>
          content &&
          !isLegacyAgentOutboundMessage(content) &&
          !tracker.isAgentContent(message.chatId, content),
      )

    let systemPrompt: string | undefined
    if (this.deps.composeAgentPrompt && this.deps.searchKnowledge && this.deps.getPersona) {
      const persona = await this.deps.getPersona()
      if (!persona.learnFromHistory) {
        ownerStyleSamples = []
      } else {
        ownerStyleSamples = ownerStyleSamples.slice(0, persona.historySampleLimit)
      }
      const knowledge = await this.deps.searchKnowledge.execute({ query: incomingText, limit: 3 })
      const companyName = this.deps.getCompanyName ? await this.deps.getCompanyName() : undefined
      systemPrompt = this.deps.composeAgentPrompt.execute({
        persona,
        knowledgeContext: knowledge.contextText,
        ownerStyleSamples,
        usageContext: 'whatsapp_auto_reply',
        companyName,
      })
    } else {
      ownerStyleSamples = ownerStyleSamples.slice(0, 20)
    }

    const result = await this.deps.agentChatProvider.generateReply({
      incomingMessage: incomingText,
      chatId: message.chatId,
      triggerMessageId: message.id,
      ownerStyleSamples,
      recentContext,
      hasOwnerHistory: ownerStyleSamples.length > 0,
      systemPrompt,
      gatesPassed: true,
    })

    if (result.action === 'skip' || result.skipReason) {
      this.logSkip(message.chatId, displayNumber, result.skipReason ?? 'llm-skip')
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
    await this.deliverOutbound(message, displayNumber, outbound, 'sent')
  }

  private async deliverOutbound(
    message: WhatsappMessage,
    displayNumber: number,
    outbound: string,
    action: 'sent' | 'defer' | 'photo-pending',
  ): Promise<void> {
    const tracker = this.deps.agentOutboundTracker
    if (await this.deps.replyDeduplicator.isDuplicateReply(message.chatId, outbound)) {
      this.logSkip(message.chatId, displayNumber, 'duplicate-reply')
      return
    }

    tracker.register(message.chatId, outbound)
    try {
      await this.deps.sendMessage({
        to: message.chatId,
        content: outbound,
        metadata: { source: 'agent-auto-reply', messageId: message.id },
      })
      await this.deps.persistOutbound?.({
        chatId: message.chatId,
        content: outbound,
        triggerMessageId: message.id,
      })
      const decisionAction = action === 'sent' || action === 'photo-pending' ? 'sent' : 'defer'
      recordAgentReplyDecision({
        chatId: message.chatId,
        action: decisionAction,
        reason: action,
      })
      getSharedAppLogger().info(`[AgentChat] reply sent${displayNumber ? ` (#${displayNumber})` : ''}`, {
        chatId: message.chatId,
        displayNumber,
        action,
        contentLength: outbound.length,
      })
    } catch (error) {
      tracker.unregister(message.chatId, outbound)
      const errorMessage = error instanceof Error ? error.message : String(error)
      recordAgentReplyDecision({
        chatId: message.chatId,
        action: 'error',
        reason: errorMessage,
      })
      getSharedAppLogger().error('[AgentChat] send failed', {
        chatId: message.chatId,
        displayNumber,
        error: errorMessage,
      })
      throw error
    }
  }

  private async sendFixedReply(
    message: WhatsappMessage,
    displayNumber: number,
    phrase: string,
  ): Promise<void> {
    const outbound = formatAgentOutbound(phrase)
    await this.deliverOutbound(message, displayNumber, outbound, 'photo-pending')
  }

  private async sendDeferral(
    message: WhatsappMessage,
    displayNumber: number,
    phrase: string,
  ): Promise<void> {
    const outbound = formatAgentOutbound(phrase)
    await this.deliverOutbound(message, displayNumber, outbound, 'defer')
    await this.deps.pauseAfterDeferral.execute(message.chatId)
    getSharedAppLogger().info(`[AgentChat] defer${displayNumber ? ` (#${displayNumber})` : ''}`, {
      chatId: message.chatId,
      displayNumber,
      action: 'paused',
    })
  }

  private logSkip(
    chatId: string,
    displayNumber: number | undefined,
    reason: string,
    extra?: Record<string, unknown>,
  ): void {
    recordAgentReplyDecision({ chatId, action: 'skip', reason })
    getSharedAppLogger().info(
      `[AgentChat] skip: ${reason}${displayNumber ? ` (#${displayNumber})` : ''}`,
      {
        chatId,
        displayNumber,
        reason,
        ...extra,
      },
    )
  }
}
