import { NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

type RouteContext = { params: Promise<{ chatId: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await ensureWhatsappReady()
    const { chatId } = await context.params
    const decodedChatId = decodeURIComponent(chatId)
    const { deleteChatHistoryUseCase, chatConfigRepository } = getWhatsappRuntime()
    const result = await deleteChatHistoryUseCase.execute(decodedChatId)
    const config = await chatConfigRepository.findByChatId(decodedChatId)

    return NextResponse.json({
      ok: true,
      chatId: decodedChatId,
      deletedMessages: result.deletedMessages,
      deletedMediaFiles: result.deletedMediaFiles,
      name: config?.name ?? null,
      archiveEnabled: config?.archiveEnabled ?? false,
      agentChatEnabled: config?.agentChatEnabled ?? false,
      photoProcessingEnabled: config?.photoProcessingEnabled ?? false,
      audioProcessingEnabled: config?.audioProcessingEnabled ?? false,
      reportGenerationEnabled: config?.reportGenerationEnabled ?? false,
      updatedAt: config?.updatedAt.toISOString() ?? new Date().toISOString(),
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/chats/history/delete]', error)
    return NextResponse.json({ error: 'Failed to delete chat history' }, { status: 500 })
  }
}
