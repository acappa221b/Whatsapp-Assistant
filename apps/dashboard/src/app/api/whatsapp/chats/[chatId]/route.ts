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
    const { updateChatConfigUseCase, chatConfigRepository } = getWhatsappRuntime()

    const previous = await chatConfigRepository.findByChatId(decodedChatId)

    const updated = await updateChatConfigUseCase.execute(decodedChatId, {
      archiveEnabled: body.archiveEnabled,
      agentChatEnabled: body.agentChatEnabled,
      photoProcessingEnabled: body.photoProcessingEnabled,
      audioProcessingEnabled: body.audioProcessingEnabled,
      reportGenerationEnabled: body.reportGenerationEnabled,
      name: body.name,
    })

    if (
      previous &&
      !previous.audioProcessingEnabled &&
      updated.audioProcessingEnabled &&
      updated.archiveEnabled
    ) {
      const globalForWhatsapp = globalThis as {
        retryPendingAudioTranscriptionsUseCase?: {
          execute(input?: { chatId?: string }): Promise<{ retried: number }>
        }
      }
      void globalForWhatsapp.retryPendingAudioTranscriptionsUseCase
        ?.execute({ chatId: decodedChatId })
        .catch((error) => {
          console.error('[whatsapp/chats/patch] audio retry failed', error)
        })
    }

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
