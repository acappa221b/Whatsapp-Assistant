import type { Extraction } from './extraction.entity'
import type { ExtractionType } from './extraction-enums'

export type ExtractionListFilters = {
  type?: ExtractionType
  messageId?: string
}

export interface ExtractionRepository {
  save(extraction: Extraction): Promise<Extraction>
  findById(id: string): Promise<Extraction | null>
  findByMessageId(messageId: string): Promise<Extraction[]>
  findMany(filters?: ExtractionListFilters): Promise<Extraction[]>
}
