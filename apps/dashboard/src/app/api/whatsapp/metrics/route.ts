import { NextResponse } from 'next/server'
import { buildMetricsSnapshot } from '@finance-ai/core/domains/message-archive'
import { getMessageCaptureMetrics } from '@finance-ai/whatsapp'
import { mapRepositoryError } from '@/lib/api-error'
import { ensureWhatsappReady, getWhatsappMessageMetrics } from '@/lib/whatsapp/runtime'

export async function GET() {
  try {
    await ensureWhatsappReady()
    const metrics = await getWhatsappMessageMetrics()
    const snapshot = buildMetricsSnapshot({
      capture: {
        totalReceived: metrics.totalReceived,
        totalPersisted: metrics.totalPersisted,
      },
      persistedByType: metrics.types,
      emptyTextCount: metrics.emptyTextCount,
    })

    return NextResponse.json({
      totalReceived: snapshot.totalReceived,
      totalPersisted: snapshot.totalPersisted,
      lossRate: snapshot.lossRate,
      types: snapshot.types,
      emptyTextCount: snapshot.emptyTextCount,
      capture: getMessageCaptureMetrics(),
    })
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[whatsapp/metrics]', error)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
