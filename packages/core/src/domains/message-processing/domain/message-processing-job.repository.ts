import type { ProcessingStatus } from './processing-enums'
import type { MessageProcessingJob } from './message-processing-job.entity'

export type MessageProcessingJobListFilters = {
  status?: ProcessingStatus
}

export interface MessageProcessingJobRepository {
  save(job: MessageProcessingJob): Promise<MessageProcessingJob>
  findById(id: string): Promise<MessageProcessingJob | null>
  findByMessageId(messageId: string): Promise<MessageProcessingJob | null>
  findMany(filters?: MessageProcessingJobListFilters): Promise<MessageProcessingJob[]>
}
