import type { ExtractionRepository, ExtractionListFilters } from '../domain/extraction.repository'
import type { Extraction } from '../domain/extraction.entity'

export class InMemoryExtractionRepository implements ExtractionRepository {
  private readonly byId = new Map<string, Extraction>()

  async save(extraction: Extraction): Promise<Extraction> {
    this.byId.set(extraction.id, extraction)
    return extraction
  }

  async findById(id: string): Promise<Extraction | null> {
    return this.byId.get(id) ?? null
  }

  async findByMessageId(messageId: string): Promise<Extraction[]> {
    return [...this.byId.values()]
      .filter((item) => item.messageId === messageId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findMany(filters: ExtractionListFilters = {}): Promise<Extraction[]> {
    return [...this.byId.values()]
      .filter((item) => (filters.type ? item.type === filters.type : true))
      .filter((item) => (filters.messageId ? item.messageId === filters.messageId : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}
