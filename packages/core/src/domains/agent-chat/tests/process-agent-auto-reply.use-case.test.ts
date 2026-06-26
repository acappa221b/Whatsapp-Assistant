import { describe, expect, it, vi } from 'vitest'
import { WhatsappChatConfig } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.entity'
import { InMemoryWhatsappChatConfigRepository } from '../../whatsapp-chat-config/infrastructure/in-memory-whatsapp-chat-config.repository'
import { WhatsappMessage } from '../../whatsapp-message/domain/whatsapp-message.entity'
import { InMemoryWhatsappMessageRepository } from '../../whatsapp-message/infrastructure/in-memory-whatsapp-message.repository'
import { AgentOutboundTracker } from '../application/agent-outbound-tracker'
import { AgentReplyDeduplicator } from '../application/agent-reply-deduplicator'
import { ProcessAgentAutoReplyUseCase, type ProcessAgentAutoReplyDeps } from '../application/process-agent-auto-reply.use-case'
import {
  HandleHumanTakeoverUseCase,
  PauseAgentAfterDeferralUseCase,
} from '../application/handle-human-takeover.use-case'

const CHAT_ID = '5511@s.whatsapp.net'

function seedEnabledChat(repository: InMemoryWhatsappChatConfigRepository) {
  return repository.save(
    WhatsappChatConfig.create({
      chatId: CHAT_ID,
      archiveEnabled: true,
      agentChatEnabled: true,
    }),
  )
}

function createIncomingMessage(id: string, content: string, receivedAt = new Date()) {
  return WhatsappMessage.create({
    id,
    externalMessageId: `ext-${id}`,
    chatId: CHAT_ID,
    sender: 'Thiago',
    senderId: '5522@s.whatsapp.net',
    content,
    messageType: 'TEXT',
    rawPayload: {},
    fromMe: false,
    receivedAt,
  })
}

function createAgentEcho(id: string, content: string, receivedAt = new Date()) {
  return WhatsappMessage.create({
    id,
    externalMessageId: `ext-${id}`,
    chatId: CHAT_ID,
    sender: 'Eu',
    senderId: CHAT_ID,
    content,
    messageType: 'TEXT',
    rawPayload: {},
    fromMe: true,
    receivedAt,
  })
}

function createDeps(
  chatRepo: InMemoryWhatsappChatConfigRepository,
  messageRepo: InMemoryWhatsappMessageRepository,
  tracker: AgentOutboundTracker,
  overrides: Partial<ProcessAgentAutoReplyDeps> = {},
) {
  return {
    chatConfigRepository: chatRepo,
    messageRepository: messageRepo,
    agentChatProvider: { generateReply: vi.fn() },
    sendMessage: vi.fn(),
    isWhatsappConnected: () => true,
    hasOpenAIKey: () => true,
    pauseAfterDeferral: new PauseAgentAfterDeferralUseCase(chatRepo),
    agentOutboundTracker: tracker,
    replyDeduplicator: new AgentReplyDeduplicator(tracker, messageRepo),
    ...overrides,
  }
}

describe('ProcessAgentAutoReplyUseCase', () => {
  it('sends plain reply text when OpenAI returns reply', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const messageRepo = new InMemoryWhatsappMessageRepository()
    const tracker = new AgentOutboundTracker()
    await seedEnabledChat(chatRepo)

    const sendMessage = vi.fn().mockResolvedValue(undefined)
    const useCase = new ProcessAgentAutoReplyUseCase(
      createDeps(chatRepo, messageRepo, tracker, {
        agentChatProvider: {
          generateReply: vi.fn().mockResolvedValue({
            action: 'reply',
            replyText: 'tudo certo',
            shouldDefer: false,
          }),
        },
        sendMessage,
      }),
    )

    await useCase.execute(createIncomingMessage('msg-1', 'e aí?'))
    expect(sendMessage).toHaveBeenCalledWith({
      to: CHAT_ID,
      content: 'tudo certo',
      metadata: { source: 'agent-auto-reply', messageId: 'msg-1' },
    })
  })

  it('defers and pauses agent on impossible question', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const messageRepo = new InMemoryWhatsappMessageRepository()
    const tracker = new AgentOutboundTracker()
    await seedEnabledChat(chatRepo)

    const sendMessage = vi.fn().mockResolvedValue(undefined)
    const useCase = new ProcessAgentAutoReplyUseCase(
      createDeps(chatRepo, messageRepo, tracker, {
        agentChatProvider: {
          generateReply: vi.fn().mockResolvedValue({
            action: 'defer',
            replyText: '',
            shouldDefer: true,
            deferralPhrase: 'já te falo',
          }),
        },
        sendMessage,
      }),
    )

    await useCase.execute(createIncomingMessage('msg-1', 'vai na reunião das 15h?'))
    expect(sendMessage).toHaveBeenCalledOnce()
    const config = await chatRepo.findByChatId(CHAT_ID)
    expect(config?.agentPaused).toBe(true)
    expect(config?.agentPausedReason).toBe('deferral')
  })

  it('skips when agent is paused', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const tracker = new AgentOutboundTracker()
    await chatRepo.save(
      WhatsappChatConfig.create({
        chatId: CHAT_ID,
      archiveEnabled: true,
      agentChatEnabled: true,
      agentPaused: true,
        agentPausedReason: 'deferral',
      }),
    )
    const sendMessage = vi.fn()
    const useCase = new ProcessAgentAutoReplyUseCase(
      createDeps(chatRepo, new InMemoryWhatsappMessageRepository(), tracker, { sendMessage }),
    )
    await useCase.execute(createIncomingMessage('msg-1', 'oi de novo'))
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('does not skip greeting and calls OpenAI', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const messageRepo = new InMemoryWhatsappMessageRepository()
    const tracker = new AgentOutboundTracker()
    await seedEnabledChat(chatRepo)

    const sendMessage = vi.fn().mockResolvedValue(undefined)
    const generateReply = vi.fn().mockResolvedValue({
      action: 'reply',
      replyText: 'Oi! Tudo bem?',
      shouldDefer: false,
    })
    const useCase = new ProcessAgentAutoReplyUseCase(
      createDeps(chatRepo, messageRepo, tracker, {
        agentChatProvider: { generateReply },
        sendMessage,
      }),
    )

    await useCase.execute(createIncomingMessage('msg-greet', 'oi'))
    expect(generateReply).toHaveBeenCalledOnce()
    expect(sendMessage).toHaveBeenCalledWith({
      to: CHAT_ID,
      content: 'Oi! Tudo bem?',
      metadata: { source: 'agent-auto-reply', messageId: 'msg-greet' },
    })
  })

  it('skips ack-only without calling OpenAI', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const messageRepo = new InMemoryWhatsappMessageRepository()
    const tracker = new AgentOutboundTracker()
    await seedEnabledChat(chatRepo)

    const generateReply = vi.fn()
    const sendMessage = vi.fn()
    const useCase = new ProcessAgentAutoReplyUseCase(
      createDeps(chatRepo, messageRepo, tracker, { agentChatProvider: { generateReply }, sendMessage }),
    )

    await useCase.execute(createIncomingMessage('msg-1', 'Boaaa'))
    expect(generateReply).not.toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('skips when OpenAI returns action skip', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const messageRepo = new InMemoryWhatsappMessageRepository()
    const tracker = new AgentOutboundTracker()
    await seedEnabledChat(chatRepo)

    const sendMessage = vi.fn()
    const useCase = new ProcessAgentAutoReplyUseCase(
      createDeps(chatRepo, messageRepo, tracker, {
        agentChatProvider: {
          generateReply: vi.fn().mockResolvedValue({
            action: 'skip',
            replyText: '',
            shouldDefer: false,
            skipReason: 'llm-skip',
          }),
        },
        sendMessage,
      }),
    )

    await useCase.execute(createIncomingMessage('msg-1', 'legal demais'))
    expect(sendMessage).not.toHaveBeenCalled()
    const config = await chatRepo.findByChatId(CHAT_ID)
    expect(config?.agentPaused).toBe(false)
  })

  it('reproduces Thiago thread: one ack then silence on status and boa', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    const messageRepo = new InMemoryWhatsappMessageRepository()
    const tracker = new AgentOutboundTracker()
    await seedEnabledChat(chatRepo)

    const t0 = new Date('2025-06-25T10:00:00Z')
    const t1 = new Date('2025-06-25T10:01:00Z')
    const t2 = new Date('2025-06-25T10:02:00Z')
    const t3 = new Date('2025-06-25T10:03:00Z')
    const t4 = new Date('2025-06-25T10:04:00Z')

    await messageRepo.save(
      createIncomingMessage(
        'q1',
        'e ai, como está o dispositivo passa/não passa? conseguiram liberar?',
        t0,
      ),
    )
    await messageRepo.save(createIncomingMessage('a1', 'Estou finalizando', t1))
    await messageRepo.save(
      createAgentEcho('agent1', 'beleza, avisa quando finalizar?', t2),
    )
    tracker.register(CHAT_ID, 'beleza, avisa quando finalizar?')

    const sendMessage = vi.fn().mockResolvedValue(undefined)
    const generateReply = vi.fn().mockResolvedValue({
      action: 'reply',
      replyText: 'beleza, avisa quando finalizar?',
      shouldDefer: false,
    })

    const useCase = new ProcessAgentAutoReplyUseCase(
      createDeps(chatRepo, messageRepo, tracker, {
        agentChatProvider: { generateReply },
        sendMessage,
      }),
    )

    await useCase.execute(createIncomingMessage('a2', 'Só um ajuste fino mesmo.', t3))
    expect(generateReply).not.toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()

    await useCase.execute(createIncomingMessage('a3', 'Boaaa', t4))
    expect(generateReply).not.toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })
})

describe('HandleHumanTakeoverUseCase', () => {
  it('disables agentChatEnabled on owner message', async () => {
    const chatRepo = new InMemoryWhatsappChatConfigRepository()
    await seedEnabledChat(chatRepo)
    await new HandleHumanTakeoverUseCase(chatRepo).execute(CHAT_ID)
    const config = await chatRepo.findByChatId(CHAT_ID)
    expect(config?.agentChatEnabled).toBe(false)
    expect(config?.agentPausedReason).toBe('human_takeover')
  })
})
