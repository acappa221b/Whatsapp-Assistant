import { NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { handleAssistantChat } from '@/lib/assistant/assistant-service'

type Body = {
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  confirmAction?: boolean
  actionToken?: string
  previewText?: string
  extraConfirm?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    if (!body.confirmAction && !body.message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const result = await handleAssistantChat({
      message: body.message?.trim() ?? '',
      history: body.history,
      confirmAction: body.confirmAction,
      actionToken: body.actionToken,
      previewText: body.previewText,
      extraConfirm: body.extraConfirm,
    })

    return NextResponse.json(result)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[assistant/chat]', error)
    return NextResponse.json({ error: 'Assistant request failed' }, { status: 500 })
  }
}
