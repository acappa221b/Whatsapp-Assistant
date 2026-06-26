import { describe, expect, it } from 'vitest'
import { ConfidenceScore } from '../../../domain/value-objects/confidence-score'

describe('ConfidenceScore', () => {
  it('uses provided confidence for non-manual sources', () => {
    expect(ConfidenceScore.defaultForSource('OCR', 0.75).value).toBe(0.75)
  })
})
