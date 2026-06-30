import { NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady } from '@/lib/whatsapp/runtime'

export async function POST(request: Request) {
  try {
    await ensureWhatsappReady()
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId') ?? undefined

    const globalForWhatsapp = globalThis as {
      retryPendingAudioTranscriptionsUseCase?: {
        execute(input?: { chatId?: string; includeFailed?: boolean }): Promise<{ retried: number }>
      }
    }
    const retryUseCase = globalForWhatsapp.retryPendingAudioTranscriptionsUseCase
    if (!retryUseCase) {
      return NextResponse.json({ error: 'Transcription retry not ready' }, { status: 503 })
    }

    const result = await retryUseCase.execute({
      chatId,
      includeFailed: searchParams.get('includeFailed') === '1',
    })
    return NextResponse.json(result)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/messages/retry-transcriptions]', error)
    return NextResponse.json({ error: 'Failed to retry transcriptions' }, { status: 500 })
  }
}
