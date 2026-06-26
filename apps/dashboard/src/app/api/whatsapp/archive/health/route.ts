import { NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappArchiveHealth } from '@/lib/whatsapp/runtime'

export async function GET() {
  try {
    await ensureWhatsappReady()
    const health = getWhatsappArchiveHealth()
    return NextResponse.json(health)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/archive/health]', error)
    return NextResponse.json({ error: 'Failed to load archive health' }, { status: 500 })
  }
}
