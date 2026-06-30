'use client'

import { useMemo } from 'react'
import { parseAudioMessageContent } from '@finance-ai/shared/utils'

type Props = {
  content: string
  audioProcessingEnabled: boolean
  fromMe: boolean
  messageId?: string
  receivedAt?: string
  transcriptionStatus?: 'pending' | 'done' | 'failed' | 'none'
  onRetry?: (messageId: string) => void
}

const PENDING_SLOW_MS = 2 * 60 * 1000

export function AudioMessageBubble({
  content,
  audioProcessingEnabled,
  fromMe,
  messageId,
  receivedAt,
  transcriptionStatus,
  onRetry,
}: Props) {
  const parsed = parseAudioMessageContent(content)

  const status = useMemo(() => {
    if (transcriptionStatus && transcriptionStatus !== 'none') return transcriptionStatus
    if (parsed.isFailed) return 'failed'
    if (parsed.isTranscribed) return 'done'
    return 'pending'
  }, [transcriptionStatus, parsed.isFailed, parsed.isTranscribed])

  const pendingAgeMs = receivedAt ? Date.now() - new Date(receivedAt).getTime() : 0
  const pendingSlow = status === 'pending' && pendingAgeMs > PENDING_SLOW_MS

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium opacity-90">{parsed.label}</p>
      {audioProcessingEnabled && status === 'done' && parsed.transcription ? (
        <p className="whitespace-pre-wrap break-words text-sm opacity-95">{parsed.transcription}</p>
      ) : null}
      {audioProcessingEnabled && status === 'pending' && !fromMe ? (
        <p className="text-xs italic opacity-60">
          {pendingSlow ? 'Transcricao demorando…' : 'Transcrevendo…'}
        </p>
      ) : null}
      {audioProcessingEnabled && status === 'failed' && !fromMe ? (
        <p className="text-xs text-amber-200/90">
          Nao foi possivel transcrever. Verifique OpenAI em Configuracoes.
        </p>
      ) : null}
      {audioProcessingEnabled && (status === 'failed' || pendingSlow) && !fromMe && messageId && onRetry ? (
        <button
          type="button"
          className="text-xs underline opacity-80"
          onClick={() => onRetry(messageId)}
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  )
}
