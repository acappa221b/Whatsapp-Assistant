import { NextResponse } from 'next/server'
import { isChatNameResolved, serializeWhatsappChatConfigApi } from '@finance-ai/shared/utils'
import { prisma } from '@finance-ai/database'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

export async function GET() {
  try {
    await ensureWhatsappReady()
    console.info('[RC-02/API_CHATS_REQUEST]', { at: new Date().toISOString() })
    const { listChatConfigsUseCase, ensureChatDiscoveredUseCase } = getWhatsappRuntime()

    const distinctChats = await prisma.whatsappMessage.findMany({
      select: { chatId: true },
      distinct: ['chatId'],
    })
    for (const { chatId } of distinctChats) {
      await ensureChatDiscoveredUseCase.execute(chatId)
    }

    const chats = await listChatConfigsUseCase.execute()

    console.info('[RC-02/API_CHATS_RESPONSE]', {
      at: new Date().toISOString(),
      returned: chats.length,
    })

    return NextResponse.json({
      items: chats.map((chat) =>
        serializeWhatsappChatConfigApi({
          ...chat,
          nameResolved: isChatNameResolved(chat.name),
        }),
      ),
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/chats]', error)
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 })
  }
}
