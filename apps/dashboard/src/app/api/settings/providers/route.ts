import { NextResponse } from 'next/server'
import { decryptSecret, encryptSecret, maskApiKey } from '@finance-ai/shared'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import { encryptionSecret, providerRepo } from '@/lib/ai/ai-provider-service'
import { getAppLogger } from '@/lib/logging/app-log-sink'
import type { AiProviderConfigRecord } from '@finance-ai/database'
import type { AiProviderType } from '@finance-ai/database'

const VALID_PROVIDERS = ['openai', 'gemini', 'deepseek', 'custom'] as const

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}

async function mapProvider(row: AiProviderConfigRecord) {
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

export async function GET() {
  await bootstrapAppSettings()
  const providers = await providerRepo.findAll()
  return NextResponse.json({ items: await Promise.all(providers.map(mapProvider)) })
}

type CreateProviderBody = {
  provider: AiProviderType
  displayName: string
  apiKey: string
  model?: string
  baseUrl?: string
  isDefault?: boolean
  enabled?: boolean
}

export async function POST(request: Request) {
  await bootstrapAppSettings()
  try {
    const body = (await request.json()) as CreateProviderBody
    if (!body.displayName?.trim() || !body.apiKey?.trim()) {
      return NextResponse.json({ error: 'Nome e API key são obrigatórios' }, { status: 400 })
    }
    if (!VALID_PROVIDERS.includes(body.provider as (typeof VALID_PROVIDERS)[number])) {
      return NextResponse.json({ error: `Provedor inválido: ${body.provider}` }, { status: 400 })
    }

    const secret = await encryptionSecret()
    const created = await providerRepo.create({
      provider: body.provider,
      displayName: body.displayName.trim(),
      apiKeyEnc: encryptSecret(body.apiKey.trim(), secret),
      model: body.model?.trim() || null,
      baseUrl: body.baseUrl?.trim() || null,
      isDefault: body.isDefault ?? false,
      enabled: body.enabled ?? true,
    })
    return NextResponse.json(await mapProvider(created), { status: 201 })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          error:
            'Já existe um provedor com este nome para este tipo. Edite o existente ou use outro nome.',
        },
        { status: 409 },
      )
    }
    getAppLogger().error('[settings/providers POST] Falha ao salvar provedor', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Falha ao salvar provedor' }, { status: 500 })
  }
}
