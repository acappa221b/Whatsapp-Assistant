import { NextResponse } from 'next/server'
import { ensureWhatsappReady, getWhatsappDiagnostics } from '@/lib/whatsapp/runtime'

export async function GET() {
  await ensureWhatsappReady()
  const body = await getWhatsappDiagnostics()
  return NextResponse.json(body)
}
