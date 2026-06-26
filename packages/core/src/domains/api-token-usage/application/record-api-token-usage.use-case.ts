import { calculateTokenCostBrl, type OpenAIConfig } from '@finance-ai/shared/config'
import type { ApiTokenUsageRepository, RecordApiTokenUsageInput } from '../domain/api-token-usage.types'

export class RecordApiTokenUsageUseCase {
  constructor(
    private readonly repository: ApiTokenUsageRepository,
    private readonly pricing: Pick<
      OpenAIConfig,
      'inputPricePer1mBrl' | 'outputPricePer1mBrl' | 'avgCostPer1kTokensBrl'
    >,
  ) {}

  async execute(input: RecordApiTokenUsageInput) {
    const tokensInput = Math.max(0, input.tokensInput)
    const tokensOutput = Math.max(0, input.tokensOutput)
    const tokensTotal = tokensInput + tokensOutput
    const costBrl = calculateTokenCostBrl(tokensInput, tokensOutput, this.pricing)

    return this.repository.record({
      ...input,
      tokensInput,
      tokensOutput,
      tokensTotal,
      costBrl,
    })
  }
}
