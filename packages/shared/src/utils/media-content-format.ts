export const AUDIO_CONTENT_PREFIX = '[ÁUDIO]'
export const PHOTO_CONTENT_PREFIX = '[FOTO]'
export const PHOTO_PENDING_AGENT_REPLY =
  'Opa, recebi a foto! Em breve já dou uma olhada e te falo.'

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
