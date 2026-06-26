import { describe, expect, it, vi } from 'vitest'
import { DomainEvents, InMemoryEventBus } from '../events/index'

describe('InMemoryEventBus', () => {
  it('publishes events to subscribers', async () => {
    const bus = new InMemoryEventBus()
    const handler = vi.fn()

    bus.subscribe(DomainEvents.MessageReceived, handler)
    await bus.publish({
      name: DomainEvents.MessageReceived,
      payload: { text: 'hello' },
      occurredAt: new Date(),
    })

    expect(handler).toHaveBeenCalledOnce()
  })

  it('does nothing when no handlers are registered', async () => {
    const bus = new InMemoryEventBus()
    await expect(
      bus.publish({
        name: DomainEvents.ImageReceived,
        payload: {},
        occurredAt: new Date(),
      }),
    ).resolves.toBeUndefined()
  })

  it('notifies multiple handlers', async () => {
    const bus = new InMemoryEventBus()
    const first = vi.fn()
    const second = vi.fn()

    bus.subscribe(DomainEvents.ExpenseDetected, first)
    bus.subscribe(DomainEvents.ExpenseDetected, second)

    await bus.publish({
      name: DomainEvents.ExpenseDetected,
      payload: { amount: 10 },
      occurredAt: new Date(),
    })

    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })

  it('unsubscribes handler', async () => {
    const bus = new InMemoryEventBus()
    const handler = vi.fn()
    const unsubscribe = bus.subscribe(DomainEvents.ExpenseApproved, handler)

    unsubscribe()
    await bus.publish({
      name: DomainEvents.ExpenseApproved,
      payload: {},
      occurredAt: new Date(),
    })

    expect(handler).not.toHaveBeenCalled()
  })
})
