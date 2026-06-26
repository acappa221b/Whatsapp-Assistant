export interface MessageProcessingQueue {
  enqueue(messageId: string): Promise<void>
  dequeue(): Promise<string | null>
  remove(messageId: string): Promise<void>
  requeue(messageId: string): Promise<void>
  list(): Promise<string[]>
  contains(messageId: string): Promise<boolean>
}
