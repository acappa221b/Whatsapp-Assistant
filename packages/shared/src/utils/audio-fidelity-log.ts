export type AudioFidelityStage =
  | 'audit_start'
  | 'download_ok'
  | 'download_failed'
  | 'stored'
  | 'awaiting_whisper'

export function logAudioFidelity(input: {
  stage: AudioFidelityStage
  messageId: string
  externalMessageId?: string
  mimeType?: string | null
  durationSeconds?: number | null
  fileSize?: number | null
  storagePath?: string | null
  contentHash?: string | null
  error?: string
}): void {
  console.info('[RC07/AUDIO]', {
    at: new Date().toISOString(),
    ...input,
  })
}
