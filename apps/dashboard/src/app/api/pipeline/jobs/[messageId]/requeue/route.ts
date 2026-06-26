import { NextResponse } from 'next/server'
import {
  ensureProcessingPipelineRegistered,
  getPipelineRuntime,
} from '@/lib/pipeline/runtime'

type RouteContext = { params: Promise<{ messageId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  ensureProcessingPipelineRegistered()
  const { messageId } = await context.params
  const { requeueUseCase } = getPipelineRuntime()

  try {
    const job = await requeueUseCase.execute(messageId)
    return NextResponse.json({
      id: job.id,
      messageId: job.messageId,
      status: job.status,
      processor: job.processor,
      processedAt: job.processedAt?.toISOString() ?? null,
      durationMs: job.durationMs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Requeue failed'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
