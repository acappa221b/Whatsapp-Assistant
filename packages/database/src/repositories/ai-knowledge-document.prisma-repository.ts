import type { Prisma, PrismaClient } from '@prisma/client'

export type KnowledgeDocumentType = 'text' | 'excel' | 'csv' | 'image'
export type KnowledgeDocumentStatus = 'processing' | 'ready' | 'error'

export type AiKnowledgeDocumentRecord = {
  id: string
  title: string
  type: KnowledgeDocumentType
  status: KnowledgeDocumentStatus
  storagePath: string
  useInAgent: boolean
  parsedContent: unknown
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateKnowledgeDocumentInput = {
  id: string
  title: string
  type: KnowledgeDocumentType
  storagePath: string
  useInAgent?: boolean
}

export class AiKnowledgeDocumentPrismaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<AiKnowledgeDocumentRecord[]> {
    const rows = await this.prisma.aiKnowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => this.map(row))
  }

  async findById(id: string): Promise<AiKnowledgeDocumentRecord | null> {
    const row = await this.prisma.aiKnowledgeDocument.findUnique({ where: { id } })
    return row ? this.map(row) : null
  }

  async listReadyForAgent(): Promise<AiKnowledgeDocumentRecord[]> {
    const rows = await this.prisma.aiKnowledgeDocument.findMany({
      where: { status: 'ready', useInAgent: true },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map((row) => this.map(row))
  }

  async create(input: CreateKnowledgeDocumentInput): Promise<AiKnowledgeDocumentRecord> {
    const row = await this.prisma.aiKnowledgeDocument.create({
      data: {
        id: input.id,
        title: input.title,
        type: input.type,
        storagePath: input.storagePath,
        useInAgent: input.useInAgent ?? true,
        status: 'processing',
      },
    })
    return this.map(row)
  }

  async markReady(id: string, parsedContent: unknown): Promise<AiKnowledgeDocumentRecord> {
    const row = await this.prisma.aiKnowledgeDocument.update({
      where: { id },
      data: { status: 'ready', parsedContent: parsedContent as Prisma.InputJsonValue, errorMessage: null },
    })
    return this.map(row)
  }

  async markError(id: string, errorMessage: string): Promise<AiKnowledgeDocumentRecord> {
    const row = await this.prisma.aiKnowledgeDocument.update({
      where: { id },
      data: { status: 'error', errorMessage },
    })
    return this.map(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aiKnowledgeDocument.delete({ where: { id } })
  }

  private map(row: {
    id: string
    title: string
    type: string
    status: string
    storagePath: string
    useInAgent: boolean
    parsedContent: unknown
    errorMessage: string | null
    createdAt: Date
    updatedAt: Date
  }): AiKnowledgeDocumentRecord {
    return {
      id: row.id,
      title: row.title,
      type: row.type as KnowledgeDocumentType,
      status: row.status as KnowledgeDocumentStatus,
      storagePath: row.storagePath,
      useInAgent: row.useInAgent,
      parsedContent: row.parsedContent,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
