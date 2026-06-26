import { NextResponse } from 'next/server'
import { isChatNameResolved } from '@finance-ai/shared/utils'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

type ResolveBody = {
  chatIds?: string[]
  force?: boolean
}

export async function POST(request: Request) {
  try {
    await ensureWhatsappReady()
    const body = (await request.json().catch(() => ({}))) as ResolveBody
    const { resolveChatNamesUseCase, backfillNamesUseCase } = getWhatsappRuntime()

    const result = await resolveChatNamesUseCase.execute({
      chatIds: body.chatIds,
      force: body.force,
      onNameResolved: async (chatId, name) => {
        await backfillNamesUseCase.execute({ chatId, chatName: name })
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/chats/resolve-names]', error)
    return NextResponse.json({ error: 'Failed to resolve chat names' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await ensureWhatsappReady()
    const { listChatConfigsUseCase } = getWhatsappRuntime()
    const chats = await listChatConfigsUseCase.execute()
    const unresolved = chats.filter((chat) => !isChatNameResolved(chat.name)).length
    return NextResponse.json({ total: chats.length, unresolved })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    return NextResponse.json({ error: 'Failed to read name status' }, { status: 500 })
  }
}
