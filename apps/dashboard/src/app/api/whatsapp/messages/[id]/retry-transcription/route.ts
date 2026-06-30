import { NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady } from '@/lib/whatsapp/runtime'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    await ensureWhatsappReady()
    const { id } = await context.params

    const globalForWhatsapp = globalThis as {
      transcribeAudioUseCase?: { execute(messageId: string): Promise<void> }
    }
    const transcribeUseCase = globalForWhatsapp.transcribeAudioUseCase
    if (!transcribeUseCase) {
      return NextResponse.json({ error: 'Transcription not ready' }, { status: 503 })
    }

    await transcribeUseCase.execute(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/messages/retry-transcription]', error)
    return NextResponse.json({ error: 'Failed to retry transcription' }, { status: 500 })
  }
}
