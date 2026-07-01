import { NextResponse } from 'next/server'
import { getContactSyncSnapshot } from '@/lib/whatsapp/contact-sync-tracker'
import { ensureWhatsappReady, getWhatsappOperationalStatus } from '@/lib/whatsapp/runtime'

export async function GET() {
  await ensureWhatsappReady()
  const operational = await getWhatsappOperationalStatus()
  return NextResponse.json({
    ...getContactSyncSnapshot(),
    connected: operational.connected,
  })
}
