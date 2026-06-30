export const AUDIO_CONTENT_PREFIX = '[ÁUDIO]'
export const PHOTO_CONTENT_PREFIX = '[FOTO]'
export const AUDIO_DISPLAY_LABEL = '[Áudio]'
export const PHOTO_PENDING_AGENT_REPLY =
  'Opa, recebi a foto! Em breve já dou uma olhada e te falo.'

export type ParsedAudioMessage = {
  label: string
  transcription: string | null
  isTranscribed: boolean
}

const AUDIO_PREFIXES = ['[ÁUDIO]', '[áudio]', '[audio]', '[Audio]', '[AUDIO]']

/** Normaliza [audio], [áudio], [ÁUDIO] texto... */
export function parseAudioMessageContent(content: string | null | undefined): ParsedAudioMessage {
  const trimmed = content?.trim() ?? ''
  for (const prefix of AUDIO_PREFIXES) {
    if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      const rest = trimmed.slice(prefix.length).trim()
      return {
        label: AUDIO_DISPLAY_LABEL,
        transcription: rest || null,
        isTranscribed: rest.length > 0,
      }
    }
  }
  return { label: AUDIO_DISPLAY_LABEL, transcription: null, isTranscribed: false }
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

export function formatPhotoContent(description: string, caption?: string | null): string {
  const base = description.trim() || caption?.trim() || 'imagem recebida'
  const captionPart = caption?.trim() && !base.includes(caption.trim()) ? ` — ${caption.trim()}` : ''
  return `${PHOTO_CONTENT_PREFIX} ${base}${captionPart}`
}
