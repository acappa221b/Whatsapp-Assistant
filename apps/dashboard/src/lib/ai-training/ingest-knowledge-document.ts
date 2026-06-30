import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  catalogRowsToSearchText,
  parseCsvCatalog,
  parseExcelCatalog,
} from '@finance-ai/excel'
import type { AiKnowledgeDocumentPrismaRepository } from '@finance-ai/database'
import { getUnifiedProvider } from '@/lib/ai/ai-provider-service'

const TRAINING_ROOT = join(process.cwd(), 'storage', 'training')

export type IngestKnowledgeInput = {
  id: string
  title: string
  type: 'text' | 'excel' | 'csv' | 'image'
  buffer: Buffer
  originalName: string
}

export async function saveKnowledgeOriginal(
  id: string,
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  const dir = join(TRAINING_ROOT, id)
  await mkdir(dir, { recursive: true })
  const storagePath = join(dir, 'original')
  await writeFile(storagePath, buffer)
  await writeFile(join(dir, 'meta.json'), JSON.stringify({ originalName }), 'utf-8')
  return storagePath
}

export async function ingestKnowledgeDocument(
  repo: AiKnowledgeDocumentPrismaRepository,
  input: IngestKnowledgeInput,
): Promise<void> {
  try {
    if (input.type === 'text') {
      const text = input.buffer.toString('utf-8').trim()
      const chunks = text.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean)
      await repo.markReady(input.id, { chunks, text })
      return
    }

    if (input.type === 'csv') {
      const { rows } = parseCsvCatalog(input.buffer.toString('utf-8'))
      await repo.markReady(input.id, {
        rows,
        text: catalogRowsToSearchText(rows),
      })
      return
    }

    if (input.type === 'excel') {
      const { rows } = await parseExcelCatalog(input.buffer)
      await repo.markReady(input.id, {
        rows,
        text: catalogRowsToSearchText(rows),
      })
      return
    }

    if (input.type === 'image') {
      const dir = dirname(join(TRAINING_ROOT, input.id, 'original'))
      const tempPath = join(dir, 'vision-input')
      await writeFile(tempPath, input.buffer)
      const provider = await getUnifiedProvider('vision')
      if (!provider) {
        throw new Error('Vision provider not configured')
      }
      const result = await provider.describeImage(
        tempPath,
        'Descreva a imagem e extraia todo texto visivel (OCR). Responda em portugues.',
      )
      const text = result.text.trim()
      await repo.markReady(input.id, {
        chunks: text ? [text] : [],
        text,
        visionModel: result.model,
      })
      return
    }

    throw new Error(`Unsupported knowledge type: ${input.type}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await repo.markError(input.id, message)
  }
}

export async function reprocessKnowledgeDocument(
  repo: AiKnowledgeDocumentPrismaRepository,
  id: string,
): Promise<void> {
  const doc = await repo.findById(id)
  if (!doc) throw new Error('Document not found')
  const buffer = await readFile(doc.storagePath)
  const metaPath = join(dirname(doc.storagePath), 'meta.json')
  let originalName = doc.title
  try {
    const meta = JSON.parse(await readFile(metaPath, 'utf-8')) as { originalName?: string }
    if (meta.originalName) originalName = meta.originalName
  } catch {
    // ignore missing meta
  }
  await ingestKnowledgeDocument(repo, {
    id,
    title: doc.title,
    type: doc.type,
    buffer,
    originalName,
  })
}

export async function deleteKnowledgeStorage(id: string): Promise<void> {
  await rm(join(TRAINING_ROOT, id), { recursive: true, force: true })
}

export function inferKnowledgeType(
  mimeType: string,
  fileName: string,
): 'text' | 'excel' | 'csv' | 'image' | null {
  const lower = fileName.toLowerCase()
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.xls')
  ) {
    return 'excel'
  }
  if (mimeType.includes('csv') || lower.endsWith('.csv')) return 'csv'
  if (mimeType.startsWith('text/') || lower.endsWith('.txt')) return 'text'
  if (mimeType.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(lower)) return 'image'
  return null
}

export function newKnowledgeId(): string {
  return randomUUID()
}
