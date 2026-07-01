/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMessageSendQueue } from './use-message-send-queue'

describe('useMessageSendQueue', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('processes three messages in order for the same chat', async () => {
    const order: string[] = []
    const gates = new Map<string, () => void>()

    const send = vi.fn(async (_chatId: string, content: string) => {
      order.push(content)
      await new Promise<void>((resolve) => {
        gates.set(content, resolve)
      })
      return { id: `srv-${content}` }
    })

    const { result } = renderHook(() => useMessageSendQueue({ send }), {
      reactStrictMode: false,
    })

    act(() => {
      result.current.enqueue('chat-a', 'one')
      result.current.enqueue('chat-a', 'two')
      result.current.enqueue('chat-a', 'three')
    })

    for (const word of ['one', 'two', 'three'] as const) {
      await waitFor(() => expect(order).toContain(word))
      await act(async () => {
        gates.get(word)?.()
      })
    }

    await waitFor(() => expect(order).toEqual(['one', 'two', 'three']))
    expect(send).toHaveBeenCalledTimes(3)
  })

  it('marks failed item and keeps later messages queued', async () => {
    let rejectSecond: ((error: Error) => void) | undefined
    const send = vi.fn(async (_chatId: string, content: string) => {
      if (content === 'ok') return { id: 'srv-ok' }
      if (content === 'bad') {
        await new Promise<void>((_resolve, reject) => {
          rejectSecond = reject
        })
      }
      return { id: `srv-${content}` }
    })

    const { result } = renderHook(() => useMessageSendQueue({ send }), {
      reactStrictMode: false,
    })

    act(() => {
      result.current.enqueue('chat-a', 'ok')
      result.current.enqueue('chat-a', 'bad')
      result.current.enqueue('chat-a', 'later')
    })

    await waitFor(() => expect(send).toHaveBeenCalledWith('chat-a', 'ok'))

    await waitFor(() => expect(send).toHaveBeenCalledWith('chat-a', 'bad'))

    await act(async () => {
      rejectSecond?.(new Error('network'))
    })

    await waitFor(() => {
      expect(result.current.items.find((item) => item.content === 'bad')?.status).toBe('failed')
      expect(result.current.items.find((item) => item.content === 'later')?.status).toBe('queued')
    })
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('does not block queue for another chat', async () => {
    let resolveChatA: (() => void) | undefined
    const send = vi.fn(async (chatId: string) => {
      if (chatId === 'chat-a') {
        await new Promise<void>((resolve) => {
          resolveChatA = resolve
        })
      }
      return { id: `srv-${chatId}` }
    })

    const { result } = renderHook(() => useMessageSendQueue({ send }), {
      reactStrictMode: false,
    })

    act(() => {
      result.current.enqueue('chat-a', 'blocked')
      result.current.enqueue('chat-b', 'free')
    })

    await waitFor(() => expect(send).toHaveBeenCalledWith('chat-b', 'free'))
    expect(send.mock.calls.some(([chatId]) => chatId === 'chat-a')).toBe(true)

    await act(async () => {
      resolveChatA?.()
    })
    await waitFor(() => expect(send).toHaveBeenCalledWith('chat-a', 'blocked'))
  })
})
