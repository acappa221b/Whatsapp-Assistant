import type { MessageType } from '@finance-ai/core/domain/value-objects/whatsapp-enums'
import type { Extraction as PrismaExtraction, Prisma } from '@prisma/client'
import { Extraction } from '@finance-ai/core/domains/extraction'
import type { ExtractionCandidateData, ExtractionType } from '@finance-ai/core/domains/extraction'

type PrismaExtractionRecord = PrismaExtraction & {
  sourceType?: MessageType
  processingTimeMs?: number | null
  tokensInput?: number | null
  tokensOutput?: number | null
  storagePath?: string | null
}

export type ExtractionPersistence = {
  id: string
  messageId: string
  type: ExtractionType
  sourceType: MessageType
  confidence: number
  data: Prisma.InputJsonValue
  processingTimeMs: number | null
  tokensInput: number | null
  tokensOutput: number | null
  storagePath: string | null
  model: string
  createdAt: Date
}

export const ExtractionMapper = {
  toDomain(record: PrismaExtractionRecord): Extraction {
    return Extraction.reconstitute({
      id: record.id,
      messageId: record.messageId,
      type: record.type as ExtractionType,
      sourceType: record.sourceType as MessageType,
      confidence: record.confidence,
      data: record.data as ExtractionCandidateData,
      processingTimeMs: record.processingTimeMs,
      tokensInput: record.tokensInput,
      tokensOutput: record.tokensOutput,
      storagePath: record.storagePath,
      model: record.model,
      createdAt: record.createdAt,
    })
  },

  toPersistence(extraction: Extraction): ExtractionPersistence {
    return {
      id: extraction.id,
      messageId: extraction.messageId,
      type: extraction.type,
      sourceType: extraction.sourceType,
      confidence: extraction.confidence,
      data: extraction.data as Prisma.InputJsonValue,
      processingTimeMs: extraction.processingTimeMs,
      tokensInput: extraction.tokensInput,
      tokensOutput: extraction.tokensOutput,
      storagePath: extraction.storagePath,
      model: extraction.model,
      createdAt: extraction.createdAt,
    }
  },
}
