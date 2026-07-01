import { describe, expect, it } from 'vitest'
import { isGreetingMessage, shouldSkipBeforeLLM } from '../application/should-auto-reply-to-message'

describe('shouldSkipBeforeLLM', () => {
  it('does not skip greetings', () => {
    expect(isGreetingMessage('oi')).toBe(true)
    expect(isGreetingMessage('olá')).toBe(true)
    expect(isGreetingMessage('tudo bem')).toBe(true)
    expect(shouldSkipBeforeLLM('oi', [])).toEqual({ skip: false })
    expect(shouldSkipBeforeLLM('olá', [])).toEqual({ skip: false })
    expect(shouldSkipBeforeLLM('tudo bem', [])).toEqual({ skip: false })
    expect(shouldSkipBeforeLLM('e aí, tudo bem?', [])).toEqual({ skip: false })
  })

  it('skips ack-only messages', () => {
    expect(shouldSkipBeforeLLM('Boaaa', [])).toEqual({ skip: true, reason: 'ack-only' })
    expect(shouldSkipBeforeLLM('boa', [])).toEqual({ skip: true, reason: 'ack-only' })
    expect(shouldSkipBeforeLLM('kkkkk', [])).toEqual({ skip: true, reason: 'ack-only' })
    expect(shouldSkipBeforeLLM('show', [])).toEqual({ skip: true, reason: 'ack-only' })
    expect(shouldSkipBeforeLLM('legal', [])).toEqual({ skip: true, reason: 'ack-only' })
  })

  it('does not skip real questions', () => {
    expect(shouldSkipBeforeLLM('conseguiram liberar?', [])).toEqual({ skip: false })
    expect(shouldSkipBeforeLLM('como está o dispositivo?', [])).toEqual({ skip: false })
  })

  it('skips status incremental after assistant ack', () => {
    const context = [
      { role: 'user' as const, content: 'conseguiram liberar?' },
      { role: 'assistant' as const, content: 'beleza, avisa quando finalizar?' },
    ]
    expect(shouldSkipBeforeLLM('Só um ajuste fino mesmo.', context)).toEqual({
      skip: true,
      reason: 'status-after-ack',
    })
  })
})
