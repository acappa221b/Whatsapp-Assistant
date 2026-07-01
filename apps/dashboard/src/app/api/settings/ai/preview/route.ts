import { NextResponse } from 'next/server'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import {
  getCompanyName,
  getDefaultPersona,
  previewAgentReplyUseCase,
} from '@/lib/ai-training/ai-training-service'
import { prisma } from '@finance-ai/database'
import { isLegacyAgentOutboundMessage } from '@finance-ai/shared/utils'

type Body = {
  message: string
  chatId?: string
  simulateLiveGates?: boolean
}

export async function POST(request: Request) {
  await bootstrapAppSettings()
  const body = (await request.json()) as Body
  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const persona = await getDefaultPersona()
  let ownerStyleSamples: string[] = []
  if (persona.learnFromHistory) {
    const rows = await prisma.whatsappMessage.findMany({
      where: { fromMe: true, ...(body.chatId ? { chatId: body.chatId } : {}) },
      orderBy: { receivedAt: 'desc' },
      take: persona.historySampleLimit,
      select: { content: true },
    })
    ownerStyleSamples = rows
      .map((row) => row.content.trim())
      .filter((content) => content && !isLegacyAgentOutboundMessage(content))
  }

  try {
    const result = await previewAgentReplyUseCase.execute({
      message,
      chatId: body.chatId,
      persona,
      ownerStyleSamples,
      companyName: await getCompanyName(),
      simulateLiveGates: body.simulateLiveGates ?? false,
    })

    return NextResponse.json({
      action: result.action,
      replyText: result.replyText,
      shouldDefer: result.shouldDefer,
      deferralPhrase: result.deferralPhrase,
      skipReason: result.skipReason,
      matchedDocuments: result.matchedDocuments,
      systemPromptPreview: result.systemPrompt.slice(0, 2000),
    })
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: err }, { status: 503 })
  }
}
