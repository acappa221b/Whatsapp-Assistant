import { zodResponseFormat } from 'openai/helpers/zod'
import { describe, expect, it } from 'vitest'
import { ExtractionResultSchema } from './extraction-result.schema'

describe('ExtractionResultSchema', () => {
  it('parses expense candidate result', () => {
    const parsed = ExtractionResultSchema.parse({
      type: 'EXPENSE_CANDIDATE',
      confidence: 0.97,
      data: {
        description: 'Balas',
        amount: 4,
        categorySuggestion: null,
        supplierSuggestion: null,
        date: null,
        reason: null,
        confidence: 0.97,
      },
      model: 'gpt-test',
    })

    expect(parsed.type).toBe('EXPENSE_CANDIDATE')
  })

  it('parses revenue candidate result', () => {
    const parsed = ExtractionResultSchema.parse({
      type: 'REVENUE_CANDIDATE',
      confidence: 0.95,
      data: {
        description: 'Cliente Joao',
        amount: 500,
        categorySuggestion: null,
        supplierSuggestion: null,
        date: null,
        reason: null,
        confidence: 0.95,
      },
      model: 'gpt-test',
    })

    expect(parsed.type).toBe('REVENUE_CANDIDATE')
  })

  it('parses unknown result with object root contract', () => {
    const parsed = ExtractionResultSchema.parse({
      type: 'UNKNOWN',
      confidence: 0,
      data: {
        description: 'UNKNOWN',
        amount: 0,
        categorySuggestion: null,
        supplierSuggestion: null,
        date: null,
        reason: 'Nao foi possivel classificar',
        confidence: 0,
      },
      model: 'gpt-test',
    })

    expect(parsed.type).toBe('UNKNOWN')
    expect(parsed.data.reason).toBe('Nao foi possivel classificar')
  })

  it('rejects invalid free-form payload', () => {
    expect(() =>
      ExtractionResultSchema.parse({
        type: 'EXPENSE_CANDIDATE',
        confidence: 1.2,
        data: 'texto livre',
        model: 'gpt-test',
      }),
    ).toThrow()
  })

  it('generates an object root for OpenAI structured outputs', () => {
    const responseFormat = zodResponseFormat(ExtractionResultSchema, 'extraction_result')
    const schema = (
      responseFormat as {
        json_schema?: { schema?: { type?: string; properties?: Record<string, unknown> } }
      }
    ).json_schema?.schema

    expect(schema?.type).toBe('object')
    expect(schema?.properties).toHaveProperty('type')
    expect(schema?.properties).toHaveProperty('data')
  })
})
