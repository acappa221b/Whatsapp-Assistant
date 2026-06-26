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
    await provider.connectFresh()
    const status = await waitForProviderStatus(
      (current) => current.status === 'qr' || current.status === 'connected',
    )
    return NextResponse.json({
      ok: true,
      status: status.status,
      qrCodeDataUrl: status.qrCodeDataUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset WhatsApp session'
    console.error('[whatsapp/reset-session]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
