import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { ExtractionCandidateData } from './candidate'
import type { ExtractionType } from './extraction-enums'

export type AIExtractionResultInput = {
  type: ExtractionType
  sourceType: MessageType
  confidence: number
  data: ExtractionCandidateData
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
