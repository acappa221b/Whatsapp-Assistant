import { describe, expect, it } from 'vitest'
import { InMemoryMessageProcessingQueue } from '../infrastructure/in-memory-message-processing-queue'

describe('InMemoryMessageProcessingQueue', () => {
  it('enqueues and dequeues in FIFO order', async () => {
    const queue = new InMemoryMessageProcessingQueue()
    await queue.enqueue('a')
    await queue.enqueue('b')
    expect(await queue.dequeue()).toBe('a')
    expect(await queue.dequeue()).toBe('b')
    expect(await queue.dequeue()).toBeNull()
  })

  it('does not duplicate enqueue', async () => {
    const queue = new InMemoryMessageProcessingQueue()
    await queue.enqueue('a')
    await queue.enqueue('a')
    expect(await queue.list()).toEqual(['a'])
  })

  it('requeues to the tail', async () => {
    const queue = new InMemoryMessageProcessingQueue()
    await queue.enqueue('a')
    await queue.enqueue('b')
    await queue.requeue('a')
    expect(await queue.list()).toEqual(['b', 'a'])
  })

  it('removes a specific message', async () => {
    const queue = new InMemoryMessageProcessingQueue()
    await queue.enqueue('a')
    await queue.enqueue('b')
    await queue.remove('a')
    expect(await queue.list()).toEqual(['b'])
  })
})
