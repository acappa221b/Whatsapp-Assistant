import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { Extraction, assertExtractionType } from '..'

describe('Extraction entity', () => {
  it('creates expense candidate extraction', () => {
    const extraction = Extraction.create({
      id: 'ext-1',
      messageId: 'msg-1',
      type: 'EXPENSE_CANDIDATE',
      sourceType: 'TEXT',
      confidence: 0.97,
      data: {
        description: 'Balas',
        amount: 4,
        confidence: 0.97,
      },
      model: 'gpt-4.1-mini',
    })

    expect(extraction.type).toBe('EXPENSE_CANDIDATE')
    expect(extraction.confidence).toBe(0.97)
  })

  it('rejects empty messageId', () => {
    expect(() =>
      Extraction.create({
        id: 'ext-1',
        messageId: '  ',
        type: 'UNKNOWN',
        sourceType: 'TEXT',
        confidence: 0.2,
        data: { reason: 'unclear' },
        model: 'gpt-4.1-mini',
      }),
    ).toThrow(ValidationError)
  })

  it('validates extraction type', () => {
    expect(assertExtractionType('REVENUE_CANDIDATE')).toBe('REVENUE_CANDIDATE')
    expect(() => assertExtractionType('INVALID')).toThrow(ValidationError)
  })

  it('normalizes blank storagePath to null', () => {
    const extraction = Extraction.create({
      id: 'ext-2',
      messageId: 'msg-2',
      type: 'UNKNOWN',
      sourceType: 'IMAGE',
      confidence: 0,
      data: { reason: 'unsupported' },
      storagePath: '   ',
      model: 'system',
    })
    expect(extraction.storagePath).toBeNull()
  })

  it('rejects negative metrics', () => {
    expect(() =>
      Extraction.create({
        id: 'ext-3',
        messageId: 'msg-3',
        type: 'UNKNOWN',
        sourceType: 'DOCUMENT',
        confidence: 0,
        data: { reason: 'bad' },
        processingTimeMs: -1,
        model: 'system',
      }),
    ).toThrow(/Processing time/)
  })
})
