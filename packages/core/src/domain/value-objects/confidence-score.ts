import { ValidationError } from '@finance-ai/shared/errors'

export class ConfidenceScore {
  readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static create(value: number): ConfidenceScore {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new ValidationError('Confidence must be between 0 and 1')
    }
    return new ConfidenceScore(value)
  }

  static defaultForSource(source: string, provided?: number): ConfidenceScore {
    if (source === 'MANUAL') {
      return ConfidenceScore.create(1)
    }
    if (provided !== undefined) {
      return ConfidenceScore.create(provided)
    }
    return ConfidenceScore.create(0.5)
  }
}
