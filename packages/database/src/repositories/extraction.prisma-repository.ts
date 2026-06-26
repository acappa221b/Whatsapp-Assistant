import type { PrismaClient } from '@prisma/client'
import type { Extraction, ExtractionListFilters, ExtractionRepository } from '@finance-ai/core/domains/extraction'
import { ExtractionMapper } from '../mappers/extraction.mapper'

export class ExtractionPrismaRepository implements ExtractionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(extraction: Extraction): Promise<Extraction> {
    const data = ExtractionMapper.toPersistence(extraction)
    const saved = await this.prisma.extraction.upsert({
      where: { id: extraction.id },
      create: data,
      update: data,
    })
    return ExtractionMapper.toDomain(saved)
  }

  async findById(id: string): Promise<Extraction | null> {
    const record = await this.prisma.extraction.findUnique({ where: { id } })
    return record ? ExtractionMapper.toDomain(record) : null
  }

  async findByMessageId(messageId: string): Promise<Extraction[]> {
    const records = await this.prisma.extraction.findMany({
      where: { messageId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map(ExtractionMapper.toDomain)
  }

  async findMany(filters: ExtractionListFilters = {}): Promise<Extraction[]> {
    const records = await this.prisma.extraction.findMany({
      where: {
        type: filters.type,
        messageId: filters.messageId,
      },
      orderBy: { createdAt: 'desc' },
    })
    return records.map(ExtractionMapper.toDomain)
  }
}
