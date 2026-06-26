import { NextResponse } from 'next/server'
import { ensureProcessingPipelineRegistered, getPipelineRuntime } from '@/lib/pipeline/runtime'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureServerReady } from '@/lib/server-ready'

export async function GET() {
  try {
    await ensureServerReady()
    ensureProcessingPipelineRegistered()
    const { listExtractionsUseCase, whatsappRepository } = getPipelineRuntime()
    const extractions = await listExtractionsUseCase.execute()

    const items = await Promise.all(
      extractions.map(async (extraction: Awaited<ReturnType<typeof listExtractionsUseCase.execute>>[number]) => {
        const message = await whatsappRepository.findById(extraction.messageId)
        return {
          id: extraction.id,
          messageId: extraction.messageId,
          messageContent: message?.content ?? '—',
          sender: message?.sender ?? '—',
          sourceType: extraction.sourceType,
          messageType: message?.messageType ?? extraction.sourceType,
          type: extraction.type,
          confidence: extraction.confidence,
          processingTimeMs: extraction.processingTimeMs,
          tokensInput: extraction.tokensInput,
          tokensOutput: extraction.tokensOutput,
          model: extraction.model,
          mimeType: message?.mimeType ?? null,
          fileName: message?.fileName ?? null,
          fileSize: message?.fileSize ?? null,
          storagePath: extraction.storagePath ?? message?.storagePath ?? null,
          previewUrl:
            extraction.storagePath || message?.storagePath
              ? `/api/whatsapp/messages/${extraction.messageId}/preview`
              : null,
          downloadUrl:
            extraction.storagePath || message?.storagePath
              ? `/api/whatsapp/messages/${extraction.messageId}/download`
              : null,
          status: extraction.type === 'UNKNOWN' ? 'REJECTED' : 'CREATED',
          data: extraction.data,
          createdAt: extraction.createdAt.toISOString(),
        }
      }),
    )

    return NextResponse.json({ items })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[extractions]', error)
    return NextResponse.json({ error: 'Failed to list extractions' }, { status: 500 })
  }
}
