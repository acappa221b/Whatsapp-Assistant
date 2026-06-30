import { NextResponse } from 'next/server'
import {
  resolveMessageDisplayContent,
  formatChatDisplayId,
  getAudioTranscriptionStatus,
  shouldHideInboundAudioUntilTranscribed,
} from '@finance-ai/shared/utils'
import { ensureWhatsappReady, getChatIdentityResolver, getWhatsappRuntime } from '@/lib/whatsapp/runtime'
import { mapRepositoryError } from '@/lib/api-error'

export async function GET(request: Request) {
  try {
    await ensureWhatsappReady()
    console.info('[RC-02/API_MESSAGES_REQUEST]', {
      at: new Date().toISOString(),
      url: request.url,
    })
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') ?? '1')
    const limit = Number(searchParams.get('limit') ?? '20')
    const processedParam = searchParams.get('processed')
    const chatId = searchParams.get('chatId') ?? undefined
    const processed =
      processedParam === 'true' ? true : processedParam === 'false' ? false : undefined

    const { listUseCase, chatConfigRepository } = getWhatsappRuntime()
    const identity = getChatIdentityResolver()

    let chatDisplayNumber: number | null = null
    let audioProcessingEnabled = false
    if (chatId) {
      const config = await chatConfigRepository.findByChatId(chatId)
      if (!config?.archiveEnabled) {
        return NextResponse.json({ error: 'Chat not enabled for archive' }, { status: 403 })
      }
      chatDisplayNumber = config.displayNumber
      audioProcessingEnabled = config.audioProcessingEnabled
    }

    const result = await listUseCase.execute({ processed, chatId }, { page, limit })

    const visibleItems = result.items.filter(
      (message) =>
        !shouldHideInboundAudioUntilTranscribed(
          message.content,
          message.messageType,
          audioProcessingEnabled,
        ),
    )

    console.info('[RC-05/API_MESSAGES_RESPONSE]', {
      at: new Date().toISOString(),
      chatId: chatId ?? null,
      total: result.total,
      returned: result.items.length,
      page: result.page,
      limit: result.limit,
    })

    return NextResponse.json({
      chatDisplayNumber,
      chatDisplayLabel: chatDisplayNumber ? formatChatDisplayId(chatDisplayNumber) : null,
      items: visibleItems.map((message) => ({
        id: message.id,
        externalMessageId: message.externalMessageId,
        chatId: message.chatId,
        chatName: identity.resolveChatName({
          chatId: message.chatId,
          chatName: message.chatName,
        }),
        sender: message.sender,
        senderId: message.senderId,
        senderName: identity.resolveSenderName({ senderName: message.senderName }),
        content: resolveMessageDisplayContent(message.content, message.messageType),
        messageType: message.messageType,
        transcriptionStatus: getAudioTranscriptionStatus(message.content, message.messageType),
        fromMe: message.fromMe,
        mediaUrl: message.mediaUrl,
        mimeType: message.mimeType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        storagePath: message.storagePath,
        previewUrl: message.storagePath ? `/api/whatsapp/messages/${message.id}/preview` : null,
        downloadUrl: message.storagePath ? `/api/whatsapp/messages/${message.id}/download` : null,
        processed: message.processed,
        receivedAt: message.receivedAt.toISOString(),
        createdAt: message.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/messages]', error)
    return NextResponse.json({ error: 'Failed to list messages' }, { status: 500 })
  }
}
