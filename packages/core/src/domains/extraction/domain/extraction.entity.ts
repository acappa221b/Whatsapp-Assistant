import { ValidationError } from '@finance-ai/shared/errors'
import { ConfidenceScore } from '../../../domain/value-objects/confidence-score'
import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { ExtractionCandidateData } from './candidate'
import { assertExtractionType, type ExtractionType } from './extraction-enums'

export type ExtractionProps = {
  id: string
  messageId: string
  type: ExtractionType
  sourceType: MessageType
  confidence: number
  data: ExtractionCandidateData
  processingTimeMs: number | null
  tokensInput: number | null
  tokensOutput: number | null
  storagePath: string | null
  model: string
  createdAt: Date
}

export class Extraction {
  readonly id: string
  readonly messageId: string
  readonly type: ExtractionType
  readonly sourceType: MessageType
  readonly confidence: number
  readonly data: ExtractionCandidateData
  readonly processingTimeMs: number | null
  readonly tokensInput: number | null
  readonly tokensOutput: number | null
  readonly storagePath: string | null
  readonly model: string
  readonly createdAt: Date

  private constructor(props: ExtractionProps) {
    this.id = props.id
    this.messageId = props.messageId
    this.type = props.type
    this.sourceType = props.sourceType
    this.confidence = props.confidence
    this.data = props.data
    this.processingTimeMs = props.processingTimeMs
    this.tokensInput = props.tokensInput
    this.tokensOutput = props.tokensOutput
    this.storagePath = props.storagePath
    this.model = props.model
    this.createdAt = props.createdAt
  }

  static create(input: {
    id: string
    messageId: string
    type: ExtractionType
    sourceType: MessageType
    confidence: number
    data: ExtractionCandidateData
    processingTimeMs?: number | null
    tokensInput?: number | null
    tokensOutput?: number | null
    storagePath?: string | null
    model: string
    createdAt?: Date
  }): Extraction {
    const messageId = input.messageId.trim()
    if (!messageId) throw new ValidationError('Message ID is required')

    const model = input.model.trim()
    if (!model) throw new ValidationError('Model is required')

    return new Extraction({
      id: input.id,
      messageId,
      type: assertExtractionType(input.type),
      sourceType: input.sourceType,
      confidence: ConfidenceScore.create(input.confidence).value,
      data: input.data,
      processingTimeMs: Extraction.validateOptionalMetric(input.processingTimeMs, 'Processing time'),
      tokensInput: Extraction.validateOptionalMetric(input.tokensInput, 'Input tokens'),
      tokensOutput: Extraction.validateOptionalMetric(input.tokensOutput, 'Output tokens'),
      storagePath: Extraction.validateOptionalTrimmed(input.storagePath),
      model,
      createdAt: input.createdAt ?? new Date(),
    })
  }

  static reconstitute(props: ExtractionProps): Extraction {
    return new Extraction({
      ...props,
      type: assertExtractionType(props.type),
      confidence: ConfidenceScore.create(props.confidence).value,
      processingTimeMs: Extraction.validateOptionalMetric(props.processingTimeMs, 'Processing time'),
      tokensInput: Extraction.validateOptionalMetric(props.tokensInput, 'Input tokens'),
      tokensOutput: Extraction.validateOptionalMetric(props.tokensOutput, 'Output tokens'),
      storagePath: Extraction.validateOptionalTrimmed(props.storagePath),
    })
  }

  private static validateOptionalMetric(value: number | null | undefined, label: string): number | null {
    if (value === undefined || value === null) return null
    if (!Number.isInteger(value) || value < 0) {
      throw new ValidationError(`${label} must be a non-negative integer`)
    }
    return value
  }

  private static validateOptionalTrimmed(value: string | null | undefined): string | null {
    if (value === undefined || value === null) return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
}
