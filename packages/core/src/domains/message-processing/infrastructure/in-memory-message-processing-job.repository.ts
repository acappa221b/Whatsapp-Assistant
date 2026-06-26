import type { MessageProcessingJob } from '../domain/message-processing-job.entity'
import type {
  MessageProcessingJobListFilters,
  MessageProcessingJobRepository,
} from '../domain/message-processing-job.repository'

export class InMemoryMessageProcessingJobRepository implements MessageProcessingJobRepository {
  private readonly byId = new Map<string, MessageProcessingJob>()
  private readonly byMessageId = new Map<string, MessageProcessingJob>()

  async save(job: MessageProcessingJob): Promise<MessageProcessingJob> {
    this.byId.set(job.id, job)
    this.byMessageId.set(job.messageId, job)
    return job
  }

  async findById(id: string): Promise<MessageProcessingJob | null> {
    return this.byId.get(id) ?? null
  }

  async findByMessageId(messageId: string): Promise<MessageProcessingJob | null> {
    return this.byMessageId.get(messageId) ?? null
  }

  async findMany(filters: MessageProcessingJobListFilters = {}): Promise<MessageProcessingJob[]> {
    const items = [...this.byId.values()]
    if (!filters.status) return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return items
      .filter((job) => job.status === filters.status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}
