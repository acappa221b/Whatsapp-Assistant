import { NextResponse } from 'next/server'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'
import { createDailyReportServices } from '@/lib/jobs/daily-report.job'

type Body = {
  chatId: string
  reportDate?: string
}

export async function POST(request: Request) {
  try {
    await ensureWhatsappReady()
    const body = (await request.json()) as Body
    if (!body.chatId?.trim()) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 })
    }

    const { generateDailyChatReport } = createDailyReportServices(getWhatsappRuntime())
    const report = await generateDailyChatReport.execute({
      chatId: body.chatId.trim(),
      reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not generated (disabled or empty day)' }, { status: 422 })
    }

    return NextResponse.json({
      ...report,
      reportDate: report.reportDate.toISOString(),
      generatedAt: report.generatedAt.toISOString(),
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[reports/generate]', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
