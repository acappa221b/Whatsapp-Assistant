import type { ParsedEnv } from './env.schema'

export type OpenAIConfig = {
  apiKey: string
  model: string
  timeoutMs: number
  retryAttempts: number
  retryDelayMs: number
  inputPricePer1mBrl: number
  outputPricePer1mBrl: number
  avgCostPer1kTokensBrl: number
  statelessPerMessage: true
  historyEnabled: false
  memoryEnabled: false
}

export function createOpenAIConfig(env: ParsedEnv): OpenAIConfig {
  if (env.NODE_ENV === 'production' && !env.OPENAI_API_KEY.trim()) {
    throw new Error('Invalid environment configuration: OPENAI_API_KEY is required')
  }

  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    timeoutMs: env.OPENAI_TIMEOUT_MS,
    retryAttempts: env.OPENAI_RETRY_ATTEMPTS,
    retryDelayMs: env.OPENAI_RETRY_DELAY_MS,
    inputPricePer1mBrl: env.OPENAI_INPUT_PRICE_PER_1M_BRL,
    outputPricePer1mBrl: env.OPENAI_OUTPUT_PRICE_PER_1M_BRL,
    avgCostPer1kTokensBrl: env.OPENAI_AVG_COST_PER_1K_TOKENS_BRL,
    statelessPerMessage: true,
    historyEnabled: false,
    memoryEnabled: false,
  }
}

/** Custo estimado em BRL — usa preços por 1M se configurados, senão média por 1k tokens. */
export function calculateTokenCostBrl(
  tokensInput: number,
  tokensOutput: number,
  cfg: Pick<OpenAIConfig, 'inputPricePer1mBrl' | 'outputPricePer1mBrl' | 'avgCostPer1kTokensBrl'>,
): number {
  if (cfg.inputPricePer1mBrl > 0 || cfg.outputPricePer1mBrl > 0) {
    return (
      (tokensInput / 1_000_000) * cfg.inputPricePer1mBrl +
      (tokensOutput / 1_000_000) * cfg.outputPricePer1mBrl
    )
  }
  const total = tokensInput + tokensOutput
  return (total / 1000) * cfg.avgCostPer1kTokensBrl
}

/** Log seguro de presença da chave — nunca imprime o valor real. */
export function logOpenAIApiKeyPresence(apiKey: string | undefined): void {
  const present = typeof apiKey === 'string' && apiKey.trim().length > 0
  if (!present) {
    console.warn('[OpenAI] Erro: OPENAI_API_KEY não foi carregada no ambiente local')
    return
  }
  console.info('[OpenAI] OPENAI_API_KEY presente no ambiente (valor omitido por segurança)')
}
