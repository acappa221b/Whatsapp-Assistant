import type { MessageProcessingQueue } from '../domain/message-processing-queue'

export class InMemoryMessageProcessingQueue implements MessageProcessingQueue {
  private readonly items: string[] = []

  async enqueue(messageId: string): Promise<void> {
    if (this.items.includes(messageId)) return
    this.items.push(messageId)
  }

  async dequeue(): Promise<string | null> {
    return this.items.shift() ?? null
  }

  async remove(messageId: string): Promise<void> {
    const index = this.items.indexOf(messageId)
    if (index >= 0) this.items.splice(index, 1)
  }

  async requeue(messageId: string): Promise<void> {
    const index = this.items.indexOf(messageId)
    if (index >= 0) this.items.splice(index, 1)
    this.items.push(messageId)
  }

  async list(): Promise<string[]> {
    return [...this.items]
  }

  async contains(messageId: string): Promise<boolean> {
    return this.items.includes(messageId)
  }
}
