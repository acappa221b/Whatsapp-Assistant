import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { Extraction } from '@finance-ai/core/domains/extraction'
import { ExtractionPrismaRepository } from './extraction.prisma-repository'

function createExtraction() {
  return Extraction.create({
    id: 'ext-1',
    messageId: 'msg-1',
    type: 'EXPENSE_CANDIDATE',
    sourceType: 'TEXT',
    confidence: 0.97,
    data: { description: 'Balas', amount: 4, confidence: 0.97 },
    model: 'gpt-test',
    createdAt: new Date('2025-06-01T12:00:00Z'),
  })
}

describe('ExtractionPrismaRepository (unit)', () => {
  const prisma = {
    extraction: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as PrismaClient
  const repository = new ExtractionPrismaRepository(prisma)

  beforeEach(() => vi.clearAllMocks())

  it('findById returns null when missing', async () => {
    vi.mocked(prisma.extraction.findUnique).mockResolvedValue(null)
    await expect(repository.findById('missing')).resolves.toBeNull()
  })

  it('findMany applies filters', async () => {
    vi.mocked(prisma.extraction.findMany).mockResolvedValue([])
    await repository.findMany({ type: 'EXPENSE_CANDIDATE', messageId: 'msg-1' })
    expect(prisma.extraction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: 'EXPENSE_CANDIDATE', messageId: 'msg-1' },
      }),
    )
  })

  it('save maps domain entity', async () => {
    const extraction = createExtraction()
    vi.mocked(prisma.extraction.upsert).mockResolvedValue({
      id: extraction.id,
      messageId: extraction.messageId,
      type: extraction.type,
      sourceType: extraction.sourceType,
      confidence: extraction.confidence,
      data: extraction.data,
      processingTimeMs: extraction.processingTimeMs,
      tokensInput: extraction.tokensInput,
      tokensOutput: extraction.tokensOutput,
      storagePath: extraction.storagePath,
      model: extraction.model,
      createdAt: extraction.createdAt,
    })

    const saved = await repository.save(extraction)
    expect(saved.id).toBe('ext-1')
  })
})
