export type AIExtractionResultInput = {
  type: 'EXPENSE_CANDIDATE' | 'REVENUE_CANDIDATE' | 'UNKNOWN'
  sourceType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'UNKNOWN'
  confidence: number
  data: Record<string, unknown>
  processingTimeMs?: number | null
  tokensInput?: number | null
  tokensOutput?: number | null
  storagePath?: string | null
  model: string
}

export type TextExtractionInput = {
  messageId: string
  text: string
}

export type MediaExtractionInput = {
  messageId: string
  content: string
  mediaUrl?: string | null
  mimeType?: string | null
  fileName?: string | null
  fileSize?: number | null
  storagePath?: string | null
}

export interface AIExtractionProvider {
  extractText(input: TextExtractionInput): Promise<AIExtractionResultInput>
  extractImage(input: MediaExtractionInput): Promise<AIExtractionResultInput>
  extractDocument(input: MediaExtractionInput): Promise<AIExtractionResultInput>
  extractAudio(input: MediaExtractionInput): Promise<AIExtractionResultInput>
}
