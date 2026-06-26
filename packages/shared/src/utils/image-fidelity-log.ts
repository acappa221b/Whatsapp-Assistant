export type ImageFidelityStage =
  | 'download_start'
  | 'download_ok'
  | 'download_failed'
  | 'extract_start'
  | 'extract_ok'
  | 'extract_empty'
  | 'extract_failed'

export function logImageFidelity(input: {
  stage: ImageFidelityStage
  messageId: string
  externalMessageId?: string
  mimeType?: string | null
  hasCaption?: boolean
  error?: string
  extractionType?: string
}): void {
  console.info('[RC-06F/image]', {
    at: new Date().toISOString(),
    ...input,
  })
}
