import { NextResponse } from 'next/server'
import { ensureWhatsappReady, getWhatsappOperationalStatus } from '@/lib/whatsapp/runtime'

export async function GET() {
  await ensureWhatsappReady()
  const body = await getWhatsappOperationalStatus()
  return NextResponse.json(body)
}
