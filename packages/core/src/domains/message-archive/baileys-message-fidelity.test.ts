import { describe, expect, it } from 'vitest'
import { classifyBaileysContent } from './baileys-message-classifier'

/** RC-06F fixtures — real Baileys payload shapes for fidelity regression. */
describe('BaileysMessageClassifier fidelity (RC-06F)', () => {
  it('preserves extendedTextMessage', () => {
    const result = classifyBaileysContent({
      message: { extendedTextMessage: { text: 'Resposta longa com link' } },
    })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Resposta longa com link')
  })

  it('preserves templateButtonReplyMessage', () => {
    const result = classifyBaileysContent({
      message: {
        templateButtonReplyMessage: { selectedDisplayText: 'Sim, confirmar' },
      },
    })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Sim, confirmar')
  })

  it('preserves listResponseMessage title and description', () => {
    const byTitle = classifyBaileysContent({
      message: { listResponseMessage: { title: 'Opção A' } },
    })
    expect(byTitle.messageType).toBe('TEXT')
    expect(byTitle.content).toBe('Opção A')

    const byDescription = classifyBaileysContent({
      message: { listResponseMessage: { description: 'Detalhe da opção' } },
    })
    expect(byDescription.content).toBe('Detalhe da opção')
  })

  it('preserves buttonsResponseMessage', () => {
    const result = classifyBaileysContent({
      message: { buttonsResponseMessage: { selectedDisplayText: 'Pagar agora' } },
    })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Pagar agora')
  })

  it('unwraps editedMessage wrapper', () => {
    const result = classifyBaileysContent({
      message: {
        editedMessage: { message: { conversation: 'Texto corrigido' } },
      },
    })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Texto corrigido')
  })

  it('unwraps ephemeralMessage wrapper', () => {
    const result = classifyBaileysContent({
      message: {
        ephemeralMessage: { message: { conversation: 'Msg temporária' } },
      },
    })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Msg temporária')
  })

  it('unwraps viewOnceMessage wrapper', () => {
    const result = classifyBaileysContent({
      message: {
        viewOnceMessage: {
          message: { imageMessage: { caption: 'Foto única', mimetype: 'image/jpeg' } },
        },
      },
    })
    expect(result.messageType).toBe('IMAGE')
    expect(result.content).toBe('Foto única')
  })

  it('unwraps documentWithCaptionMessage', () => {
    const result = classifyBaileysContent({
      message: {
        documentWithCaptionMessage: {
          message: {
            documentMessage: { caption: 'Nota fiscal', fileName: 'nf.pdf', mimetype: 'application/pdf' },
          },
        },
      },
    })
    expect(result.messageType).toBe('DOCUMENT')
    expect(result.content).toBe('Nota fiscal')
  })

  it('classifies image without caption as [image]', () => {
    const result = classifyBaileysContent({
      message: { imageMessage: { mimetype: 'image/jpeg' } },
    })
    expect(result.messageType).toBe('IMAGE')
    expect(result.content).toBe('[image]')
  })

  it('classifies sticker separately', () => {
    const result = classifyBaileysContent({
      message: { stickerMessage: { mimetype: 'image/webp' } },
    })
    expect(result.messageType).toBe('STICKER')
    expect(result.content).toBe('[sticker]')
  })

  it('preserves interactiveResponseMessage body', () => {
    const result = classifyBaileysContent({
      message: {
        interactiveResponseMessage: { body: { text: 'Resposta interativa' } },
      },
    })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Resposta interativa')
  })

  it('unwraps deviceSentMessage chain via classifier', () => {
    const result = classifyBaileysContent({
      message: {
        deviceSentMessage: {
          message: { conversation: 'Via outro device' },
        },
      },
    })
    expect(result.messageType).toBe('TEXT')
    expect(result.content).toBe('Via outro device')
  })
})
