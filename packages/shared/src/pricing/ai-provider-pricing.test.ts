import { describe, expect, it } from 'vitest'
import { estimateTokenCostBrl } from './ai-provider-pricing'

describe('estimateTokenCostBrl', () => {
  it('returns positive cost with tokens', () => {
    const cost = estimateTokenCostBrl({
      provider: 'openai',
      model: 'gpt-4o-mini',
      tokensInput: 1000,
      tokensOutput: 500,
    })
    expect(cost).toBeGreaterThan(0)
  })

  it('uses audio minute estimate when tokens are zero', () => {
    const cost = estimateTokenCostBrl({
      provider: 'openai',
      model: 'whisper-1',
      tokensInput: 0,
      tokensOutput: 0,
      category: 'audio_processing',
      audioDurationSec: 60,
    })
    expect(cost).toBeGreaterThan(0)
  })

  it('applies minimum cost per request', () => {
    const cost = estimateTokenCostBrl({
      model: 'gpt-4o-mini',
      tokensInput: 1,
      tokensOutput: 0,
    })
    expect(cost).toBeGreaterThanOrEqual(0.0001)
  })
})
