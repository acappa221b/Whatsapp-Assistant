'use client'

import { Clock, Loader2 } from 'lucide-react'
import type { OutboundMessage } from '@/hooks/use-message-send-queue'
import { Button } from '@/components/ui/button'

type OutboundMessageBubbleProps = {
  item: OutboundMessage
  onRetry: (id: string) => void
}

export function OutboundMessageBubble({ item, onRetry }: OutboundMessageBubbleProps) {
  const failed = item.status === 'failed'

  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[78%] rounded-lg px-3 py-2 shadow-sm bg-[#005c4b] text-[#e9edef] ${
          failed ? 'border border-red-500' : ''
        } ${item.status === 'queued' ? 'opacity-70' : ''}`}
      >
        <div className="flex items-start gap-2">
          {item.status === 'queued' ? (
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8696a0]" aria-hidden />
          ) : null}
          {item.status === 'sending' ? (
            <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[#8696a0]" aria-hidden />
          ) : null}
          <p className="whitespace-pre-wrap break-words text-sm">{item.content}</p>
        </div>
        {failed ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-red-200">{item.error ?? 'Falha ao enviar'}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 border-red-300 px-2 text-[11px] text-red-100"
              onClick={() => onRetry(item.id)}
            >
              Tentar novamente
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
