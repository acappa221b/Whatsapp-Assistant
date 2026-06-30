import { NextRequest, NextResponse } from 'next/server'
import { isChatNameResolved, serializeWhatsappChatConfigApi } from '@finance-ai/shared/utils'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

export async function GET(request: NextRequest) {
  try {
    await ensureWhatsappReady()
    const { listChatConfigsPaginatedUseCase } = getWhatsappRuntime()
    const params = request.nextUrl.searchParams
    const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
    const limit = Math.min(200, Math.max(1, Number(params.get('limit') ?? '50') || 50))
    const hasMessagesParam = params.get('hasMessages')
    let hasMessages: boolean | undefined = true
    if (hasMessagesParam === 'false') hasMessages = false
    else if (hasMessagesParam === 'all') hasMessages = undefined
    else if (hasMessagesParam === 'true') hasMessages = true
    const chatTypeParam = params.get('chatType')
    const chatType =
      chatTypeParam === 'group' || chatTypeParam === 'direct' ? chatTypeParam : 'all'
    const search = params.get('search')?.trim() || undefined

    const result = await listChatConfigsPaginatedUseCase.execute({
      page,
      limit,
      hasMessages,
      chatType,
      search,
    })

    return NextResponse.json({
      items: result.items.map((chat) =>
        serializeWhatsappChatConfigApi({
          ...chat,
          nameResolved: isChatNameResolved(chat.name),
        }),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/chats]', error)
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 })
  }
}
