export const AUDIO_CONTENT_PREFIX = '[ÁUDIO]'
export const AUDIO_PENDING_CONTENT = '[AUDIO_PENDING]'
export const AUDIO_TRANSCRIPTION_FAILED_PREFIX = '[ÁUDIO_ERRO]'
export const PHOTO_CONTENT_PREFIX = '[FOTO]'
export const AUDIO_DISPLAY_LABEL = '[Áudio]'
export const PHOTO_PENDING_AGENT_REPLY =
  'Opa, recebi a foto! Em breve já dou uma olhada e te falo.'

export type ParsedAudioMessage = {
  label: string
  transcription: string | null
  isTranscribed: boolean
  isFailed: boolean
  failureReason: string | null
}

export type AudioTranscriptionStatus = 'pending' | 'done' | 'failed' | 'none'

const AUDIO_PREFIXES = ['[ÁUDIO]', '[áudio]', '[audio]', '[Audio]', '[AUDIO]']

function sanitizeShortReason(reason: string): string {
  const redacted = reason
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, 'sk-****')
    .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, 'AIza****')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer ****')
    .trim()
  if (redacted.length <= 120) return redacted
  return `${redacted.slice(0, 117)}...`
}

/** Normaliza [audio], [áudio], [ÁUDIO] texto... */
export function parseAudioMessageContent(content: string | null | undefined): ParsedAudioMessage {
  const trimmed = content?.trim() ?? ''

  if (trimmed.toLowerCase().startsWith(AUDIO_TRANSCRIPTION_FAILED_PREFIX.toLowerCase())) {
    const rest = trimmed.slice(AUDIO_TRANSCRIPTION_FAILED_PREFIX.length).trim()
    return {
      label: AUDIO_DISPLAY_LABEL,
      transcription: null,
      isTranscribed: false,
      isFailed: true,
      failureReason: rest || null,
    }
  }

  for (const prefix of AUDIO_PREFIXES) {
    if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      const rest = trimmed.slice(prefix.length).trim()
      return {
        label: AUDIO_DISPLAY_LABEL,
        transcription: rest || null,
        isTranscribed: rest.length > 0,
        isFailed: false,
        failureReason: null,
      }
    }
  }

  return {
    label: AUDIO_DISPLAY_LABEL,
    transcription: null,
    isTranscribed: false,
    isFailed: false,
    failureReason: null,
  }
}

export function isAudioPendingGate(content: string): boolean {
  return content.trim() === AUDIO_PENDING_CONTENT
}

export function isAudioTranscriptionFailed(content: string): boolean {
  return content.trim().toLowerCase().startsWith(AUDIO_TRANSCRIPTION_FAILED_PREFIX.toLowerCase())
}

export function isPendingAudioTranscription(content: string): boolean {
  if (isAudioTranscriptionFailed(content)) return false
  if (isAudioPendingGate(content)) return true
  return !parseAudioMessageContent(content).isTranscribed
}

export function shouldHideInboundAudioUntilTranscribed(
  content: string,
  messageType: string,
  audioProcessingEnabled: boolean,
): boolean {
  if (messageType !== 'AUDIO' || !audioProcessingEnabled) return false
  if (isAudioTranscriptionFailed(content)) return false
  return isPendingAudioTranscription(content)
}

export function getAudioTranscriptionStatus(
  content: string,
  messageType: string,
): AudioTranscriptionStatus {
  if (messageType !== 'AUDIO') return 'none'
  if (isAudioTranscriptionFailed(content)) return 'failed'
  if (isAudioPendingGate(content)) return 'pending'
  if (parseAudioMessageContent(content).isTranscribed) return 'done'
  return 'pending'
}

export function isTranscribedAudioContent(content: string): boolean {
  return content.trim().startsWith(AUDIO_CONTENT_PREFIX)
}

export function isProcessedPhotoContent(content: string): boolean {
  return content.trim().startsWith(PHOTO_CONTENT_PREFIX)
}

export function formatAudioContent(transcription: string): string {
  return `${AUDIO_CONTENT_PREFIX} ${transcription.trim()}`
}

export function formatAudioTranscriptionFailed(reason: string): string {
  return `${AUDIO_TRANSCRIPTION_FAILED_PREFIX} ${sanitizeShortReason(reason)}`
}

export function formatPhotoContent(description: string, caption?: string | null): string {
  const base = description.trim() || caption?.trim() || 'imagem recebida'
  const captionPart = caption?.trim() && !base.includes(caption.trim()) ? ` — ${caption.trim()}` : ''
  return `${PHOTO_CONTENT_PREFIX} ${base}${captionPart}`
}
