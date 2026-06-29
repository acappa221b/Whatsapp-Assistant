import { NextResponse } from 'next/server'
import { decryptSecret, encryptSecret, maskApiKey } from '@finance-ai/shared'
import { encryptionSecret, providerRepo } from '@/lib/ai/ai-provider-service'
import type { AiProviderConfigRecord } from '@finance-ai/database'
import type { AiProviderType } from '@finance-ai/database'

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
  const body = (await request.json()) as CreateProviderBody
  if (!body.displayName?.trim() || !body.apiKey?.trim()) {
    return NextResponse.json({ error: 'displayName and apiKey are required' }, { status: 400 })
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
}
