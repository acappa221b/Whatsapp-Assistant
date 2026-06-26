import { NextResponse } from 'next/server'
import { isChatNameResolved, serializeWhatsappChatConfigApi } from '@finance-ai/shared/utils'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

type RouteContext = { params: Promise<{ chatId: string }> }

type PatchBody = {
  archiveEnabled?: boolean
  agentChatEnabled?: boolean
  photoProcessingEnabled?: boolean
  audioProcessingEnabled?: boolean
  reportGenerationEnabled?: boolean
  name?: string | null
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await ensureWhatsappReady()
    const { chatId } = await context.params
    const decodedChatId = decodeURIComponent(chatId)
    const body = (await request.json()) as PatchBody
    const { updateChatConfigUseCase } = getWhatsappRuntime()

    const updated = await updateChatConfigUseCase.execute(decodedChatId, {
      archiveEnabled: body.archiveEnabled,
      agentChatEnabled: body.agentChatEnabled,
      photoProcessingEnabled: body.photoProcessingEnabled,
      audioProcessingEnabled: body.audioProcessingEnabled,
      reportGenerationEnabled: body.reportGenerationEnabled,
      name: body.name,
    })

    return NextResponse.json(
      serializeWhatsappChatConfigApi({
        ...updated,
        nameResolved: isChatNameResolved(updated.name),
      }),
    )
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/chats/patch]', error)
    return NextResponse.json({ error: 'Failed to update chat config' }, { status: 500 })
  }
}
