import { NextResponse } from 'next/server'
import { prisma } from '@finance-ai/database'
import { formatChatDisplayId } from '@finance-ai/shared/utils'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'
import { createDailyReportServices } from '@/lib/jobs/daily-report.job'

export async function GET(request: Request) {
  try {
    await ensureWhatsappReady()
    const url = new URL(request.url)
    const year = url.searchParams.get('year') ? Number(url.searchParams.get('year')) : undefined
    const month = url.searchParams.get('month') ? Number(url.searchParams.get('month')) : undefined
    const chatId = url.searchParams.get('chatId') ?? undefined

    const { listDailyReports } = createDailyReportServices(getWhatsappRuntime())
    const items = await listDailyReports.execute({ year, month, chatId })

    const configs = await prisma.whatsappChatConfig.findMany({
      where: chatId ? { chatId } : undefined,
      select: { chatId: true, displayNumber: true, name: true },
    })
    const configByChat = new Map(configs.map((c) => [c.chatId, c]))

    return NextResponse.json({
      items: items.map((item) => {
        const cfg = configByChat.get(item.chatId)
        return {
          ...item,
          reportDate: item.reportDate.toISOString(),
          generatedAt: item.generatedAt.toISOString(),
          displayNumber: cfg?.displayNumber,
          displayLabel: cfg ? formatChatDisplayId(cfg.displayNumber) : undefined,
          chatName: cfg?.name,
        }
      }),
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[reports/get]', error)
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 })
  }
}
