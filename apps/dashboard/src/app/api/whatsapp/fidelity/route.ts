import { NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappFidelityMetrics } from '@/lib/whatsapp/runtime'

export async function GET() {
  try {
    await ensureWhatsappReady()
    const metrics = await getWhatsappFidelityMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/fidelity]', error)
    return NextResponse.json({ error: 'Failed to load fidelity metrics' }, { status: 500 })
  }
}
