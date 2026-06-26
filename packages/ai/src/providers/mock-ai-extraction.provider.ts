import type {
  AIExtractionProvider,
  AIExtractionResultInput,
  MediaExtractionInput,
  TextExtractionInput,
} from './ai-extraction.provider'

type MockOptions = {
  textResult?: AIExtractionResultInput
  imageResult?: AIExtractionResultInput
  documentResult?: AIExtractionResultInput
  audioResult?: AIExtractionResultInput
}

export class MockAIExtractionProvider implements AIExtractionProvider {
  constructor(private readonly options: MockOptions = {}) {}

  async extractText(_input: TextExtractionInput): Promise<AIExtractionResultInput> {
    return (
      this.options.textResult ?? {
        type: 'EXPENSE_CANDIDATE',
        sourceType: 'TEXT',
        confidence: 0.97,
        data: {
          description: 'Balas',
          amount: 4,
          categorySuggestion: null,
          supplierSuggestion: null,
          date: null,
          confidence: 0.97,
        },
        model: 'mock-gpt',
      }
    )
  }

  async extractImage(_input: MediaExtractionInput): Promise<AIExtractionResultInput> {
    return this.options.imageResult ?? this.notImplemented()
  }

  async extractDocument(_input: MediaExtractionInput): Promise<AIExtractionResultInput> {
    return this.options.documentResult ?? this.notImplemented()
  }

  async extractAudio(_input: MediaExtractionInput): Promise<AIExtractionResultInput> {
    return this.options.audioResult ?? this.notImplemented()
  }

  private notImplemented(): AIExtractionResultInput {
    return {
      type: 'UNKNOWN',
      sourceType: 'UNKNOWN',
      confidence: 0,
      data: { reason: 'NOT_IMPLEMENTED' },
      model: 'mock-gpt',
    }
  }
}
