import { estimateTokenCostBrl } from '@finance-ai/shared'
import type { ApiTokenUsageRepository, RecordApiTokenUsageInput } from '../domain/api-token-usage.types'

export class RecordApiTokenUsageUseCase {
  constructor(private readonly repository: ApiTokenUsageRepository) {}

  async execute(input: RecordApiTokenUsageInput) {
    const tokensInput = Math.max(0, input.tokensInput)
    const tokensOutput = Math.max(0, input.tokensOutput)
    const tokensTotal = tokensInput + tokensOutput
    const costBrl = estimateTokenCostBrl({
      provider: input.provider,
      model: input.model,
      tokensInput,
      tokensOutput,
      category: input.category,
      audioDurationSec: input.audioDurationSec,
    })

    return this.repository.record({
      ...input,
      tokensInput,
      tokensOutput,
      tokensTotal,
      costBrl,
    })
  }
}
