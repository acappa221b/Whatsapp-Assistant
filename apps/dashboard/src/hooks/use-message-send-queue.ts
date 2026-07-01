'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type OutboundMessageStatus = 'queued' | 'sending' | 'sent' | 'failed'

export type OutboundMessage = {
  id: string
  chatId: string
  content: string
  status: OutboundMessageStatus
  createdAt: string
  error?: string
  serverMessageId?: string
}

type QueueOptions = {
  send: (chatId: string, content: string) => Promise<{ id: string }>
  onSent?: (chatId: string) => void
  onFailed?: (item: OutboundMessage, error: string) => void
}

const SENT_TTL_MS = 3000

export function useMessageSendQueue(options: QueueOptions) {
  const [items, setItems] = useState<OutboundMessage[]>([])
  const optionsRef = useRef(options)
  optionsRef.current = options
  const sendingChatIdsRef = useRef(new Set<string>())
  const blockedChatIdsRef = useRef(new Set<string>())
  const inflightItemIdsRef = useRef(new Set<string>())

  const enqueue = useCallback((chatId: string, content: string) => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        chatId,
        content,
        status: 'queued',
        createdAt: new Date().toISOString(),
      },
    ])
  }, [])

  const retry = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.status === 'failed') {
          blockedChatIdsRef.current.delete(item.chatId)
          return { ...item, status: 'queued', error: undefined }
        }
        return item
      }),
    )
  }, [])

  const countsByChat = useMemo(() => {
    const counts: Record<string, { queued: number; sending: number; failed: number }> = {}
    for (const item of items) {
      if (item.status === 'sent') continue
      if (!counts[item.chatId]) {
        counts[item.chatId] = { queued: 0, sending: 0, failed: 0 }
      }
      counts[item.chatId]![item.status] += 1
    }
    return counts
  }, [items])

  useEffect(() => {
    const next = items.find(
      (item) =>
        item.status === 'queued' &&
        !sendingChatIdsRef.current.has(item.chatId) &&
        !blockedChatIdsRef.current.has(item.chatId) &&
        !inflightItemIdsRef.current.has(item.id),
    )
    if (!next) return
    if (sendingChatIdsRef.current.has(next.chatId)) return

    const itemId = next.id
    const { chatId, content } = next
    inflightItemIdsRef.current.add(itemId)
    sendingChatIdsRef.current.add(chatId)

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: 'sending' } : item)),
    )

    void (async () => {
      try {
        const result = await optionsRef.current.send(chatId, content)
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, status: 'sent', serverMessageId: result.id }
              : item,
          ),
        )
        optionsRef.current.onSent?.(chatId)
        window.setTimeout(() => {
          setItems((prev) => prev.filter((item) => item.id !== itemId))
        }, SENT_TTL_MS)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        blockedChatIdsRef.current.add(chatId)
        setItems((prev) => {
          const updated = prev.map((item) =>
            item.id === itemId ? { ...item, status: 'failed' as const, error: message } : item,
          )
          const failedItem = updated.find((item) => item.id === itemId)
          if (failedItem) optionsRef.current.onFailed?.(failedItem, message)
          return updated
        })
      } finally {
        sendingChatIdsRef.current.delete(chatId)
        inflightItemIdsRef.current.delete(itemId)
      }
    })()
  }, [items])

  return { enqueue, retry, items, countsByChat }
}
