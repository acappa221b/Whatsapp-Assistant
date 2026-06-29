import { NextResponse } from 'next/server'
import { decryptSecret } from '@finance-ai/shared'
import { createUnifiedProvider } from '@finance-ai/ai'
import { encryptionSecret, providerRepo } from '@/lib/ai/ai-provider-service'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params
  const row = await providerRepo.findById(id)
  if (!row) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

  try {
    const apiKey = decryptSecret(row.apiKeyEnc, await encryptionSecret())
    const provider = createUnifiedProvider({
      provider: row.provider,
      apiKey,
      model: row.model,
      baseUrl: row.baseUrl,
    })
    const result = await provider.chatCompletion({
      system: 'Responda apenas OK.',
      user: 'ping',
    })
    return NextResponse.json({ ok: true, sample: result.text.slice(0, 80) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 422 },
    )
  }
}
