import { describe, expect, it } from 'vitest'
import { classifyBaileysContent } from './baileys-message-classifier'

describe('BaileysMessageClassifier (RC-04)', () => {
  it('classifies simple text', () => {
    const result = classifyBaileysContent({ message: { conversation: 'Olá mundo' } })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Olá mundo')
  })

  it('classifies long multiline text with emoji', () => {
    const long = 'Linha 1\nLinha 2\n🎉'.repeat(20)
    const result = classifyBaileysContent({ message: { conversation: long } })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe(long)
  })

  it('reclassifies empty extended text as UNKNOWN', () => {
    const result = classifyBaileysContent({ message: { extendedTextMessage: {} } })
    expect(result.messageType).toBe('UNKNOWN')
    expect(result.content).toContain('[unclassified')
  })

  it('classifies audio', () => {
    const result = classifyBaileysContent({ message: { audioMessage: { mimetype: 'audio/ogg' } } })
    expect(result.messageType).toBe('AUDIO')
    expect(result.content).toBe('[audio]')
  })

  it('classifies image with caption', () => {
    const result = classifyBaileysContent({
      message: { imageMessage: { caption: 'Foto', mimetype: 'image/jpeg' } },
    })
    expect(result.messageType).toBe('IMAGE')
    expect(result.content).toBe('Foto')
  })

  it('classifies video separately from image', () => {
    const result = classifyBaileysContent({
      message: { videoMessage: { caption: 'Clip', mimetype: 'video/mp4' } },
    })
    expect(result.messageType).toBe('VIDEO')
    expect(result.content).toBe('Clip')
  })

  it('classifies documents by extension', () => {
    for (const fileName of ['report.pdf', 'plan.docx', 'sheet.xlsx']) {
      const result = classifyBaileysContent({
        message: { documentMessage: { fileName, mimetype: 'application/octet-stream' } },
      })
      expect(result.messageType).toBe('DOCUMENT')
      expect(result.content).toBe(fileName)
    }
  })

  it('classifies sticker', () => {
    const result = classifyBaileysContent({ message: { stickerMessage: { mimetype: 'image/webp' } } })
    expect(result.messageType).toBe('STICKER')
  })

  it('classifies reaction', () => {
    const result = classifyBaileysContent({ message: { reactionMessage: { text: '👍' } } })
    expect(result.messageType).toBe('REACTION')
    expect(result.content).toBe('👍')
  })

  it('unknown payload does not throw', () => {
    const result = classifyBaileysContent({ message: { futureField: { x: 1 } } as never })
    expect(result.messageType).toBe('UNKNOWN')
    expect(result.content.length).toBeGreaterThan(0)
  })
})
