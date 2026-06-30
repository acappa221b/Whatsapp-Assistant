'use client'

import { parseAudioMessageContent } from '@finance-ai/shared/utils'

type Props = {
  content: string
  audioProcessingEnabled: boolean
  fromMe: boolean
}

export function AudioMessageBubble({ content, audioProcessingEnabled, fromMe }: Props) {
  const parsed = parseAudioMessageContent(content)

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium opacity-90">{parsed.label}</p>
      {audioProcessingEnabled && parsed.isTranscribed && parsed.transcription ? (
        <p className="whitespace-pre-wrap break-words text-sm opacity-95">{parsed.transcription}</p>
      ) : null}
      {audioProcessingEnabled && !parsed.isTranscribed && !fromMe ? (
        <p className="text-xs italic opacity-60">Transcrevendo…</p>
      ) : null}
    </div>
  )
}
