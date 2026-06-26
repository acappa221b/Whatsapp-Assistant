import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { config } from '@finance-ai/shared/config'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'
import { mapRepositoryError } from '@/lib/api-error'

type RouteContext = { params: Promise<{ id: string }> }

function resolveStoredMediaPath(storagePath: string): string {
  const mediaRoot = config.storage.mediaPath
  const absolutePath = join(mediaRoot, storagePath)
  if (!absolutePath.startsWith(mediaRoot)) {
    throw new Error('Invalid media path')
  }
  return absolutePath
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureWhatsappReady()
    const { id } = await context.params
    const { messageRepository } = getWhatsappRuntime()
    const message = await messageRepository.findById(id)

    if (!message?.storagePath || !message.mimeType) {
      return new Response('Media not found', { status: 404 })
    }

    const file = await readFile(resolveStoredMediaPath(message.storagePath))
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': message.mimeType,
        'Content-Disposition': `inline; filename="${message.fileName ?? 'media'}"`,
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/preview]', error)
    return new Response('Internal server error', { status: 500 })
  }
}
