export type PricingTier = {
  inputPer1mBrl: number
  outputPer1mBrl: number
  minCostPerRequestBrl: number
  audioPerMinuteBrl?: number
}

export const AI_PROVIDER_PRICING: Record<string, PricingTier> = {
  'openai:gpt-4o-mini': { inputPer1mBrl: 0.15, outputPer1mBrl: 0.6, minCostPerRequestBrl: 0.0001 },
  'openai:gpt-4o': { inputPer1mBrl: 2.5, outputPer1mBrl: 10.0, minCostPerRequestBrl: 0.0001 },
  'openai:whisper-1': {
    inputPer1mBrl: 0,
    outputPer1mBrl: 0,
    minCostPerRequestBrl: 0.01,
    audioPerMinuteBrl: 0.06,
  },
  'gemini:gemini-1.5-flash': { inputPer1mBrl: 0.08, outputPer1mBrl: 0.3, minCostPerRequestBrl: 0.0001 },
  'deepseek:deepseek-chat': { inputPer1mBrl: 0.11, outputPer1mBrl: 0.45, minCostPerRequestBrl: 0.0001 },
  default: { inputPer1mBrl: 0, outputPer1mBrl: 0, minCostPerRequestBrl: 0.001, audioPerMinuteBrl: 0.05 },
}

function pricingKey(provider?: string, model?: string): string {
  const m = (model ?? '').trim().toLowerCase()
  if (provider && m) return `${provider}:${m}`
  if (m.includes('whisper')) return 'openai:whisper-1'
  if (m.startsWith('gpt-4o-mini')) return 'openai:gpt-4o-mini'
  if (m.startsWith('gpt-4o')) return 'openai:gpt-4o'
  if (m.startsWith('gemini')) return 'gemini:gemini-1.5-flash'
  if (m.startsWith('deepseek')) return 'deepseek:deepseek-chat'
  return 'default'
}

export function estimateTokenCostBrl(input: {
  provider?: string
  model?: string
  tokensInput: number
  tokensOutput: number
  category?: string
  audioDurationSec?: number
}): number {
  const tier = AI_PROVIDER_PRICING[pricingKey(input.provider, input.model)] ?? AI_PROVIDER_PRICING.default!
  const tokensInput = Math.max(0, input.tokensInput)
  const tokensOutput = Math.max(0, input.tokensOutput)
  const tokensTotal = tokensInput + tokensOutput

  let calculated = 0
  if (tokensTotal > 0) {
    calculated =
      (tokensInput / 1_000_000) * tier.inputPer1mBrl + (tokensOutput / 1_000_000) * tier.outputPer1mBrl
  } else if (input.category === 'audio_processing') {
    const minutes = Math.max((input.audioDurationSec ?? 30) / 60, 1 / 60)
    calculated = minutes * (tier.audioPerMinuteBrl ?? AI_PROVIDER_PRICING.default!.audioPerMinuteBrl ?? 0.05)
  }

  const hadUsage = tokensTotal > 0 || input.category === 'audio_processing'
  if (!hadUsage) return 0
  return Math.max(calculated, tier.minCostPerRequestBrl)
}
