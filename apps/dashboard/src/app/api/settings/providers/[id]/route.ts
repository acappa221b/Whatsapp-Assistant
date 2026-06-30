import { NextResponse } from 'next/server'
import { decryptSecret, encryptSecret, maskApiKey } from '@finance-ai/shared'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import { encryptionSecret, providerRepo } from '@/lib/ai/ai-provider-service'

type Params = { params: Promise<{ id: string }> }

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}

async function mapProvider(row: Awaited<ReturnType<typeof providerRepo.findById>>) {
  if (!row) return null
  let apiKeyMasked = '****'
  try {
    const plain = decryptSecret(row.apiKeyEnc, await encryptionSecret())
    if (plain) apiKeyMasked = maskApiKey(plain)
  } catch {
    apiKeyMasked = '****'
  }
  return {
    id: row.id,
    provider: row.provider,
    displayName: row.displayName,
    apiKeyMasked,
    model: row.model,
    baseUrl: row.baseUrl,
    isDefault: row.isDefault,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function PATCH(request: Request, { params }: Params) {
  await bootstrapAppSettings()
  const { id } = await params

  try {
    const existing = await providerRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Provedor não encontrado' }, { status: 404 })
    }

    const body = (await request.json()) as {
      displayName?: string
      apiKey?: string
      model?: string | null
      baseUrl?: string | null
      isDefault?: boolean
      enabled?: boolean
    }

    const update: Record<string, unknown> = {}
    if (body.displayName !== undefined) {
      const name = body.displayName.trim()
      if (!name) {
        return NextResponse.json({ error: 'Nome exibido é obrigatório' }, { status: 400 })
      }
      update.displayName = name
    }
    if (body.model !== undefined) update.model = body.model?.trim() || null
    if (body.baseUrl !== undefined) update.baseUrl = body.baseUrl?.trim() || null
    if (body.isDefault !== undefined) update.isDefault = body.isDefault
    if (body.enabled !== undefined) update.enabled = body.enabled
    if (body.apiKey?.trim()) {
      update.apiKeyEnc = encryptSecret(body.apiKey.trim(), await encryptionSecret())
    }

    const updated = await providerRepo.update(id, update)
    const mapped = await mapProvider(updated)
    return NextResponse.json(mapped)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          error:
            'Já existe um provedor com este nome para este tipo. Use outro nome exibido.',
        },
        { status: 409 },
      )
    }
    console.error('[settings/providers PATCH]', error)
    return NextResponse.json({ error: 'Falha ao atualizar provedor' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  await bootstrapAppSettings()
  const { id } = await params
  try {
    const existing = await providerRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Provedor não encontrado' }, { status: 404 })
    }
    await providerRepo.delete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[settings/providers DELETE]', error)
    return NextResponse.json({ error: 'Falha ao remover provedor' }, { status: 500 })
  }
}
