import { NextResponse } from 'next/server'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'

export async function POST() {
  await ensureWhatsappReady()
  const { provider } = getWhatsappRuntime()
  await provider.disconnect()
  return NextResponse.json({ ok: true, status: provider.getStatus().status })
}
