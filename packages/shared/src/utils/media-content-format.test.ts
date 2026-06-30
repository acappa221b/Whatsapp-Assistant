import { describe, expect, it } from 'vitest'
import {
  formatAudioContent,
  formatPhotoContent,
  isTranscribedAudioContent,
  isProcessedPhotoContent,
  parseAudioMessageContent,
  AUDIO_DISPLAY_LABEL,
} from '@finance-ai/shared/utils'

describe('media-content-format', () => {
  it('formats and detects audio transcription', () => {
    const content = formatAudioContent('olá mundo')
    expect(content).toBe('[ÁUDIO] olá mundo')
    expect(isTranscribedAudioContent(content)).toBe(true)
  })

  it('formats and detects photo description', () => {
    const content = formatPhotoContent('uma mesa com documentos', 'recibo')
    expect(content.startsWith('[FOTO]')).toBe(true)
    expect(isProcessedPhotoContent(content)).toBe(true)
  })

  it('parseAudioMessageContent normalizes prefixes', () => {
    expect(parseAudioMessageContent('[audio]')).toEqual({
      label: AUDIO_DISPLAY_LABEL,
      transcription: null,
      isTranscribed: false,
    })
    expect(parseAudioMessageContent('[ÁUDIO] oi tudo bem')).toEqual({
      label: AUDIO_DISPLAY_LABEL,
      transcription: 'oi tudo bem',
      isTranscribed: true,
    })
    expect(parseAudioMessageContent('[audio] teste')).toEqual({
      label: AUDIO_DISPLAY_LABEL,
      transcription: 'teste',
      isTranscribed: true,
    })
  })
})
