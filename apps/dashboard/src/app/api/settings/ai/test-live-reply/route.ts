import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import {
  buildRecentContext,
  shouldSkipBeforeLLM,
} from '@finance-ai/core/domains/agent-chat'
import { WhatsappMessage } from '@finance-ai/core/domains/whatsapp-message'
import { prisma } from '@finance-ai/database'
import {
  getCompanyName,
  getDefaultPersona,
  previewAgentReplyUseCase,
} from '@/lib/ai-training/ai-training-service'
import { ensureWhatsappReady, getProcessAgentAutoReplyUseCase, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

type Body = {
  message: string
  chatId: string
  send?: boolean
}

export async function POST(request: Request) {
  await ensureWhatsappReady()

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Corpo JSON inválido' }, { status: 400 })
  }

  const message = body.message?.trim()
  const chatId = body.chatId?.trim()
  if (!message || !chatId) {
    return NextResponse.json({ error: 'message e chatId são obrigatórios' }, { status: 400 })
  }

  const config = await prisma.whatsappChatConfig.findUnique({ where: { chatId } })
  if (!config) {
    return NextResponse.json({ phase: 'error', reason: 'no-config', sent: false }, { status: 404 })
  }
  if (!config.archiveEnabled) {
    return NextResponse.json({ phase: 'skip', reason: 'archive-disabled', sent: false })
  }
  if (!config.agentChatEnabled) {
    return NextResponse.json({ phase: 'skip', reason: 'agent-disabled', sent: false })
  }
  if (config.agentPaused) {
    return NextResponse.json({
      phase: 'skip',
      reason: 'agent-paused',
      agentPausedReason: config.agentPausedReason,
      sent: false,
    })
  }

  const { provider, messageRepository } = getWhatsappRuntime()
  if (provider.getStatus().status !== 'connected') {
    return NextResponse.json({ phase: 'error', reason: 'whatsapp-disconnected', sent: false }, { status: 503 })
  }

  const recentRows = await messageRepository.findRecentByChatId(chatId, { limit: 10 })
  const recentContext = buildRecentContext(recentRows)
  const skip = shouldSkipBeforeLLM(message, recentContext)
  if (skip.skip) {
    return NextResponse.json({
      phase: 'skip',
      reason: skip.reason,
      sent: false,
    })
  }

  const persona = await getDefaultPersona()
  const preview = await previewAgentReplyUseCase.execute({
    message,
    chatId,
    persona,
    companyName: await getCompanyName(),
    simulateLiveGates: false,
  })

  if (preview.action === 'skip') {
    return NextResponse.json({
      phase: 'skip',
      reason: preview.skipReason ?? 'llm-skip',
      wouldReply: preview.replyText || undefined,
      sent: false,
    })
  }

  const wouldReply = preview.replyText?.trim() || undefined

  if (!body.send) {
    return NextResponse.json({
      phase: preview.shouldDefer ? 'defer' : 'sent',
      reason: preview.skipReason,
      wouldReply,
      sent: false,
    })
  }

  const synthetic = WhatsappMessage.create({
    id: `test-live-${randomUUID()}`,
    externalMessageId: `test-live-${randomUUID()}`,
    chatId,
    sender: 'Test',
    senderId: 'test@s.whatsapp.net',
    content: message,
    messageType: 'TEXT',
    rawPayload: { source: 'test-live-reply' },
    fromMe: false,
    receivedAt: new Date(),
  })

  try {
    await getProcessAgentAutoReplyUseCase().execute(synthetic)
    return NextResponse.json({
      phase: 'sent',
      wouldReply,
      sent: true,
    })
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ phase: 'error', reason: err, wouldReply, sent: false }, { status: 500 })
  }
}
