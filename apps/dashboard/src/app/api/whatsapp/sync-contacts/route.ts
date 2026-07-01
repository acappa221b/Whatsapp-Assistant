import { NextResponse } from 'next/server'
import { ensureWhatsappReady, runManualContactSync } from '@/lib/whatsapp/runtime'

export async function POST() {
  await ensureWhatsappReady()

  try {
    const result = await runManualContactSync()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha na sincronização'
    const statusCode =
      error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : 500
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
