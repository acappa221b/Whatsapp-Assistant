import { NextResponse } from 'next/server'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import { knowledgeRepo } from '@/lib/ai-training/ai-training-service'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  await bootstrapAppSettings()
  const { id } = await params
  const doc = await knowledgeRepo.findById(id)
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    status: doc.status,
    useInAgent: doc.useInAgent,
    parsedContent: doc.parsedContent,
    errorMessage: doc.errorMessage,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  })
}
