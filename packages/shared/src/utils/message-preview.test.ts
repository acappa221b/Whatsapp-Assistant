import { describe, expect, it } from 'vitest'
import { resolveMessagePreview } from './message-preview.ts'

describe('message-preview (RC-07)', () => {
  it('returns text preview when content exists', () => {
    expect(resolveMessagePreview('Olá mundo', 'TEXT')).toBe('Olá mundo')
  })

  it('returns human fallback for empty TEXT', () => {
    expect(resolveMessagePreview('', 'TEXT')).toBe('Mensagem de texto')
    expect(resolveMessagePreview(null, 'AUDIO')).toBe('[áudio]')
  })

  it('ignores unclassified placeholder', () => {
    expect(resolveMessagePreview('[unclassified:foo]', 'UNKNOWN')).toBe('[mensagem]')
  })
})
