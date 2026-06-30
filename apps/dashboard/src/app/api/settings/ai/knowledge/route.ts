import { NextResponse } from 'next/server'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import { knowledgeRepo } from '@/lib/ai-training/ai-training-service'
import {
  deleteKnowledgeStorage,
  inferKnowledgeType,
  ingestKnowledgeDocument,
  newKnowledgeId,
  saveKnowledgeOriginal,
} from '@/lib/ai-training/ingest-knowledge-document'

export async function GET() {
  await bootstrapAppSettings()
  const items = await knowledgeRepo.list()
  return NextResponse.json({
    items: items.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      useInAgent: doc.useInAgent,
      errorMessage: doc.errorMessage,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    })),
  })
}

export async function POST(request: Request) {
  await bootstrapAppSettings()
  const form = await request.formData()
  const file = form.get('file')
  const title = String(form.get('title') ?? '').trim()
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const typeHint = String(form.get('type') ?? '').trim() as 'text' | 'excel' | 'csv' | 'image' | ''
  const inferred =
    typeHint === 'text' || typeHint === 'excel' || typeHint === 'csv' || typeHint === 'image'
      ? typeHint
      : inferKnowledgeType(file.type, file.name)
  if (!inferred) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const id = newKnowledgeId()
  const storagePath = await saveKnowledgeOriginal(id, buffer, file.name)
  const doc = await knowledgeRepo.create({
    id,
    title: title || file.name,
    type: inferred,
    storagePath,
  })

  void ingestKnowledgeDocument(knowledgeRepo, {
    id,
    title: doc.title,
    type: inferred,
    buffer,
    originalName: file.name,
  })

  return NextResponse.json({ id: doc.id, status: doc.status }, { status: 201 })
}

export async function DELETE(request: Request) {
  await bootstrapAppSettings()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  await deleteKnowledgeStorage(id)
  await knowledgeRepo.delete(id)
  return NextResponse.json({ ok: true })
}
