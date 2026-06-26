import { NextResponse } from 'next/server'
import {
  ensureWhatsappReady,
  getWhatsappRuntime,
  waitForProviderStatus,
} from '@/lib/whatsapp/runtime'

export async function POST() {
  try {
    await ensureWhatsappReady()
    const { provider } = getWhatsappRuntime()
    await provider.connect()
    const status = await waitForProviderStatus(
      (current) => current.status === 'qr' || current.status === 'connected',
    )
    return NextResponse.json({
      ok: true,
      status: status.status,
      qrCodeDataUrl: status.qrCodeDataUrl,
      sessionLoaded: status.authenticated || status.status === 'connected' || status.status === 'qr',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect WhatsApp provider'
    console.error('[whatsapp/connect]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
