import { NextResponse } from 'next/server'
import { BroadcastWhatsappMessageUseCase } from '@finance-ai/core/domains/whatsapp-message'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

export async function POST(request: Request) {
  try {
    await ensureWhatsappReady()
    const body = (await request.json()) as { chatIds?: string[]; content?: string }
    const chatIds = body.chatIds ?? []
    const content = body.content?.trim()

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }
    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return NextResponse.json({ error: 'chatIds is required' }, { status: 400 })
    }

    const runtime = getWhatsappRuntime()
    const status = runtime.provider.getStatus()
    if (status.status !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp desconectado' }, { status: 503 })
    }

    const useCase = new BroadcastWhatsappMessageUseCase(
      runtime.chatConfigRepository,
      (msg) => runtime.provider.sendMessage(msg),
      runtime.storeUseCase,
      () => runtime.provider.getStatus().status === 'connected',
    )

    const result = await useCase.execute({ chatIds, content })
    return NextResponse.json(result)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    const message = error instanceof Error ? error.message : 'Failed to broadcast message'
    console.error('[whatsapp/broadcast]', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
