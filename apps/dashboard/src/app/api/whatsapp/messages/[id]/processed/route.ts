import { NextResponse } from 'next/server'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(_request: Request, context: RouteContext) {
  await ensureWhatsappReady()
  const { id } = await context.params
  const { markProcessedUseCase } = getWhatsappRuntime()
  const message = await markProcessedUseCase.execute(id)
  return NextResponse.json({
    id: message.id,
    processed: message.processed,
  })
}
