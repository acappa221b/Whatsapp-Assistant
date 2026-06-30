import { NextResponse } from 'next/server'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import { knowledgeRepo } from '@/lib/ai-training/ai-training-service'
import { reprocessKnowledgeDocument } from '@/lib/ai-training/ingest-knowledge-document'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  await bootstrapAppSettings()
  const { id } = await params
  const doc = await knowledgeRepo.findById(id)
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await reprocessKnowledgeDocument(knowledgeRepo, id)
  const updated = await knowledgeRepo.findById(id)
  return NextResponse.json({ id, status: updated?.status ?? 'processing' })
}
