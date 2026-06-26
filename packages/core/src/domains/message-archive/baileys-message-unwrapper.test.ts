import { describe, expect, it } from 'vitest'
import { unwrapBaileysMessage } from './baileys-message-unwrapper'

describe('unwrapBaileysMessage (RC-07)', () => {
  it('unwraps nested ephemeral → viewOnce → extendedText', () => {
    const result = unwrapBaileysMessage({
      ephemeralMessage: {
        message: {
          viewOnceMessage: {
            message: {
              extendedTextMessage: { text: 'Segredo' },
            },
          },
        },
      },
    })
    expect(result.wrappers).toEqual(['ephemeralMessage', 'viewOnceMessage'])
    expect(result.message?.extendedTextMessage?.text).toBe('Segredo')
  })

  it('unwraps deviceSentMessage → editedMessage → conversation', () => {
    const result = unwrapBaileysMessage({
      deviceSentMessage: {
        message: {
          editedMessage: {
            message: { conversation: 'Editado' },
          },
        },
      },
    })
    expect(result.wrappers).toEqual(['deviceSentMessage', 'editedMessage'])
    expect(result.message?.conversation).toBe('Editado')
  })

  it('unwraps viewOnceMessageV2Extension', () => {
    const result = unwrapBaileysMessage({
      viewOnceMessageV2Extension: {
        message: { imageMessage: { caption: 'Uma vez', mimetype: 'image/jpeg' } },
      },
    })
    expect(result.wrappers).toContain('viewOnceMessageV2Extension')
    expect(result.message?.imageMessage?.caption).toBe('Uma vez')
  })

  it('unwraps futureProofMessage', () => {
    const result = unwrapBaileysMessage({
      futureProofMessage: {
        message: { conversation: 'Future' },
      },
    })
    expect(result.wrappers).toContain('futureProofMessage')
    expect(result.message?.conversation).toBe('Future')
  })
})
