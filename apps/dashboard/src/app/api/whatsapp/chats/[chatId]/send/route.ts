import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

type Params = { params: Promise<{ chatId: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureWhatsappReady()
    const { chatId } = await params
    const body = (await request.json()) as { content?: string }
    const content = body.content?.trim()
    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const runtime = getWhatsappRuntime()
    const status = runtime.provider.getStatus()
    if (status.status !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp desconectado' }, { status: 503 })
    }

    await runtime.provider.sendMessage({ to: chatId, content })

    const externalMessageId = `manual-${randomUUID()}`
    const saved = await runtime.storeUseCase.execute({
      externalMessageId,
      chatId,
      chatName: null,
      sender: 'me',
      senderId: chatId,
      senderName: 'Você',
      content,
      messageType: 'TEXT',
      rawPayload: { source: 'dashboard-composer' },
      fromMe: true,
      receivedAt: new Date(),
    })

    return NextResponse.json({
      id: saved.id,
      chatId: saved.chatId,
      content: saved.content,
      fromMe: saved.fromMe,
      receivedAt: saved.receivedAt.toISOString(),
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/send]', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
