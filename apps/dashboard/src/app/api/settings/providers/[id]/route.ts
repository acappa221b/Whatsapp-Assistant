import { NextResponse } from 'next/server'
import { encryptSecret } from '@finance-ai/shared'
import { encryptionSecret, providerRepo } from '@/lib/ai/ai-provider-service'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = (await request.json()) as {
    displayName?: string
    apiKey?: string
    model?: string | null
    baseUrl?: string | null
    isDefault?: boolean
    enabled?: boolean
  }

  const update: Record<string, unknown> = {}
  if (body.displayName !== undefined) update.displayName = body.displayName.trim()
  if (body.model !== undefined) update.model = body.model?.trim() || null
  if (body.baseUrl !== undefined) update.baseUrl = body.baseUrl?.trim() || null
  if (body.isDefault !== undefined) update.isDefault = body.isDefault
  if (body.enabled !== undefined) update.enabled = body.enabled
  if (body.apiKey?.trim()) {
    update.apiKeyEnc = encryptSecret(body.apiKey.trim(), await encryptionSecret())
  }

  const updated = await providerRepo.update(id, update)
  return NextResponse.json({ id: updated.id })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  await providerRepo.delete(id)
  return NextResponse.json({ ok: true })
}
