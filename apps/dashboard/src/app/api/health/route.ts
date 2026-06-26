import { NextResponse } from 'next/server'
import { config } from '@finance-ai/shared/config'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'finance-ai-dashboard',
    version: config.app.version,
  })
}
