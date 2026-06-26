import { NextResponse } from 'next/server'
import {
  ensureProcessingPipelineRegistered,
  getPipelineRuntime,
} from '@/lib/pipeline/runtime'

export async function GET() {
  ensureProcessingPipelineRegistered()
  const { listJobsUseCase, queue } = getPipelineRuntime()
  const [jobs, queueIds] = await Promise.all([listJobsUseCase.execute(), queue.list()])

  return NextResponse.json({
    items: jobs.map((job) => ({
      id: job.id,
      messageId: job.messageId,
      messageType: job.messageType,
      status: job.status,
      processor: job.processor,
      metadata: job.metadata,
      error: job.error,
      queuedAt: job.queuedAt?.toISOString() ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      processedAt: job.processedAt?.toISOString() ?? null,
      durationMs: job.durationMs,
      inQueue: queueIds.includes(job.messageId),
    })),
    queueSize: queueIds.length,
  })
}
