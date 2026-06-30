import { describe, expect, it } from 'vitest'
import {
  formatAudioTranscriptionFailed,
  getAudioTranscriptionStatus,
  isAudioTranscriptionFailed,
  isPendingAudioTranscription,
  parseAudioMessageContent,
} from './media-content-format'

describe('media-content-format transcription states', () => {
  it('detects failed transcription prefix', () => {
    expect(isAudioTranscriptionFailed('[ÁUDIO_ERRO] provider missing')).toBe(true)
    expect(parseAudioMessageContent('[ÁUDIO_ERRO] provider missing')).toMatchObject({
      isFailed: true,
      isTranscribed: false,
    })
  })

  it('redacts secrets in formatAudioTranscriptionFailed', () => {
    const content = formatAudioTranscriptionFailed('Invalid key sk-1234567890abcdef')
    expect(content).toContain('sk-****')
    expect(content).not.toContain('sk-1234567890abcdef')
  })

  it('derives transcription status from content', () => {
    expect(getAudioTranscriptionStatus('[audio]', 'AUDIO')).toBe('pending')
    expect(getAudioTranscriptionStatus('[ÁUDIO] oi', 'AUDIO')).toBe('done')
    expect(getAudioTranscriptionStatus('[ÁUDIO_ERRO] x', 'AUDIO')).toBe('failed')
    expect(getAudioTranscriptionStatus('hello', 'TEXT')).toBe('none')
  })

  it('treats pending audio without transcription text', () => {
    expect(isPendingAudioTranscription('[audio]')).toBe(true)
    expect(isPendingAudioTranscription('[ÁUDIO] pronto')).toBe(false)
    expect(isPendingAudioTranscription('[ÁUDIO_ERRO] falhou')).toBe(false)
  })
})
