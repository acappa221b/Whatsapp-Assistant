import { NextResponse } from 'next/server'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

export async function POST() {
  try {
    await ensureWhatsappReady()
    const { provider } = getWhatsappRuntime()
    await provider.connect()
    const status = provider.getStatus()
    return NextResponse.json({
      ok: true,
      status: status.status,
      authenticated: status.authenticated,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reconnect WhatsApp provider'
    console.error('[whatsapp/reconnect]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
