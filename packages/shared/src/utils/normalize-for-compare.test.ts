import { describe, expect, it } from 'vitest'
import { isSemanticDuplicate, normalizeForCompare } from './normalize-for-compare'

describe('normalizeForCompare', () => {
  it('normalizes punctuation and case', () => {
    expect(normalizeForCompare('Beleza, avisa quando finalizar?')).toBe(
      'beleza avisa quando finalizar',
    )
  })

  it('detects semantic duplicates', () => {
    expect(
      isSemanticDuplicate(
        'beleza avisa quando finalizar',
        'beleza, avisa quando finalizar?',
      ),
    ).toBe(true)
  })
})
