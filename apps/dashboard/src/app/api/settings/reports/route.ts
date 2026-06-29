import { NextResponse } from 'next/server'
import { settingsRepo } from '@/lib/ai/ai-provider-service'

export async function GET() {
  const settings = await settingsRepo.get()
  return NextResponse.json({
    reportAutoEnabled: settings.reportAutoEnabled,
    reportAutoTime: settings.reportAutoTime,
    reportTimezone: settings.reportTimezone,
    lastAutoReportRunDate: settings.lastAutoReportRunDate,
  })
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    reportAutoEnabled?: boolean
    reportAutoTime?: string
    reportTimezone?: string
  }
  const updated = await settingsRepo.update(body)
  return NextResponse.json({
    reportAutoEnabled: updated.reportAutoEnabled,
    reportAutoTime: updated.reportAutoTime,
    reportTimezone: updated.reportTimezone,
    lastAutoReportRunDate: updated.lastAutoReportRunDate,
  })
}
