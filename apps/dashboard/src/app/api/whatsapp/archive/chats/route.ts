import { NextResponse } from 'next/server'
import { resolveMessagePreview, formatChatDisplayId } from '@finance-ai/shared/utils'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getChatIdentityResolver, getRuntimeHealth, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

export async function GET() {
  const startedAt = new Date().toISOString()
  try {
    await ensureWhatsappReady()
    const runtime = getWhatsappRuntime()
    const health = getRuntimeHealth()

    if (!health.valid) {
      console.error('[RC-05/archive/chats] runtime invalid after rebuild', { health, startedAt })
      return NextResponse.json(
        {
          error: 'WhatsApp runtime is invalid',
          details: `Missing components: ${health.missing.join(', ')}`,
        },
        { status: 503 },
      )
    }

    const { listChatArchiveUseCase } = runtime
    if (!listChatArchiveUseCase) {
      console.error('[RC-05/archive/chats] listChatArchiveUseCase undefined', { startedAt })
      return NextResponse.json(
        {
          error: 'Archive use case unavailable',
          details: 'listChatArchiveUseCase is not initialized on runtime',
        },
        { status: 503 },
      )
    }

    const chats = await listChatArchiveUseCase.execute()
    const identity = getChatIdentityResolver()

    console.info('[RC-05/archive/chats] success', {
      at: new Date().toISOString(),
      count: chats.length,
      runtimeVersion: health.version,
    })

    return NextResponse.json({
      items: chats.map((chat) => ({
        chatId: chat.chatId,
        displayNumber: chat.displayNumber,
        displayLabel: formatChatDisplayId(chat.displayNumber),
        chatName: identity.resolveChatName({
          chatId: chat.chatId,
          chatName: chat.chatName,
        }),
        messageCount: chat.messageCount,
        lastMessageAt: chat.lastMessageAt.toISOString(),
        lastMessagePreview: resolveMessagePreview(chat.lastMessagePreview, chat.lastMessageType),
        lastMessageType: chat.lastMessageType,
        audioProcessingEnabled: chat.audioProcessingEnabled,
      })),
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    const details = error instanceof Error ? error.message : String(error)
    console.error('[RC-05/archive/chats] failed', { startedAt, details, error })
    return NextResponse.json(
      {
        error: 'Failed to list chat archive',
        details,
      },
      { status: 500 },
    )
  }
}
