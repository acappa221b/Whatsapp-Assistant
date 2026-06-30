import { NextRequest, NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

export async function POST(request: NextRequest) {
  try {
    await ensureWhatsappReady()
    const body = (await request.json()) as {
      includeGroups?: boolean
      dryRun?: boolean
    }
    const { pruneOrphanChatConfigsUseCase } = getWhatsappRuntime()
    const result = await pruneOrphanChatConfigsUseCase.execute({
      includeGroups: body.includeGroups ?? true,
      dryRun: body.dryRun ?? true,
    })

    return NextResponse.json(result)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/chats/prune-orphans]', error)
    return NextResponse.json({ error: 'Failed to prune orphan chats' }, { status: 500 })
  }
}
