import { describe, expect, it, vi } from 'vitest'
import { InMemoryEventBus, DomainEvents } from '@finance-ai/core/events'
import { WhatsappChatConfig } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.entity'
import { InMemoryWhatsappChatConfigRepository } from '../../whatsapp-chat-config/infrastructure/in-memory-whatsapp-chat-config.repository'
import { WhatsappMessage } from '../../whatsapp-message/domain/whatsapp-message.entity'
import { InMemoryWhatsappMessageRepository } from '../../whatsapp-message/infrastructure/in-memory-whatsapp-message.repository'
import { AgentOutboundTracker } from '../application/agent-outbound-tracker'
import { AgentReplyDeduplicator } from '../application/agent-reply-deduplicator'
import { HandleHumanTakeoverUseCase, PauseAgentAfterDeferralUseCase } from '../application/handle-human-takeover.use-case'
import { ProcessAgentAutoReplyUseCase } from '../application/process-agent-auto-reply.use-case'
import { AgentAutoReplyPipeline } from '../infrastructure/agent-auto-reply.pipeline'

const CHAT_ID = '5511@s.whatsapp.net'

describe('AgentAutoReplyPipeline', () => {
  it('calls sendMessage when inbound message is persisted', async () => {
    const eventBus = new InMemoryEventBus()
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const messageRepo = new InMemoryWhatsappMessageRepository()
    const tracker = new AgentOutboundTracker()

    await chatRepo.save(
      WhatsappChatConfig.create({
        chatId: CHAT_ID,
        archiveEnabled: true,
        agentChatEnabled: true,
      }),
    )

    const sendMessage = vi.fn().mockResolvedValue(undefined)
    const processAgentAutoReply = new ProcessAgentAutoReplyUseCase({
      chatConfigRepository: chatRepo,
      messageRepository: messageRepo,
      agentChatProvider: {
        generateReply: vi.fn().mockResolvedValue({
          action: 'reply',
          replyText: 'Oi! Tudo bem?',
          shouldDefer: false,
        }),
      },
      sendMessage,
      isWhatsappConnected: () => true,
      hasOpenAIKey: () => true,
      pauseAfterDeferral: new PauseAgentAfterDeferralUseCase(chatRepo),
      agentOutboundTracker: tracker,
      replyDeduplicator: new AgentReplyDeduplicator(tracker, messageRepo),
    })

    const pipeline = new AgentAutoReplyPipeline(
      eventBus,
      messageRepo,
      new HandleHumanTakeoverUseCase(chatRepo),
      processAgentAutoReply,
      tracker,
    )
    pipeline.register()

    const message = await messageRepo.save(
      WhatsappMessage.create({
        id: 'in-1',
        externalMessageId: 'ext-in-1',
        chatId: CHAT_ID,
        sender: 'Ana',
        senderId: '5522@s.whatsapp.net',
        content: 'e aí, tudo bem?',
        messageType: 'TEXT',
        rawPayload: {},
        fromMe: false,
        receivedAt: new Date(),
      }),
    )

    await eventBus.publish({
      name: DomainEvents.WhatsappMessagePersisted,
      payload: {
        messageId: message.id,
        externalMessageId: message.externalMessageId,
        messageType: message.messageType,
        chatId: message.chatId,
        fromMe: false,
        content: message.content,
      },
      occurredAt: new Date(),
    })

    expect(sendMessage).toHaveBeenCalledWith({
      to: CHAT_ID,
      content: 'Oi! Tudo bem?',
      metadata: { source: 'agent-auto-reply', messageId: 'in-1' },
    })
  })
})
