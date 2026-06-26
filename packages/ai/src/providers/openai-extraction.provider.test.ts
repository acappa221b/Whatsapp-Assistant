import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OpenAIExtractionProvider } from './openai-extraction.provider'
import { MockAIExtractionProvider } from './mock-ai-extraction.provider'

describe('OpenAIExtractionProvider', () => {
  it('extractText returns parsed structured output', async () => {
    const provider = new OpenAIExtractionProvider({
      model: 'gpt-test',
      client: {
        beta: {
          chat: {
            completions: {
              parse: async () => ({
                choices: [
                  {
                    message: {
                      parsed: {
                        type: 'EXPENSE_CANDIDATE',
                        confidence: 0.97,
                        data: {
                          description: 'Balas',
                          amount: 4,
                          categorySuggestion: null,
                          supplierSuggestion: null,
                          date: null,
                          reason: null,
                          confidence: 0.97,
                        },
                        model: 'gpt-test',
                      },
                    },
                  },
                ],
              }),
            },
          },
        },
      },
    })

    const result = await provider.extractText({ messageId: 'msg-1', text: 'balas 4 reais' })
    expect(result.type).toBe('EXPENSE_CANDIDATE')
    expect(result.model).toBe('gpt-test')
  })

  it('extractText rejects empty parsed result', async () => {
    const provider = new OpenAIExtractionProvider({
      client: {
        beta: {
          chat: {
            completions: {
              parse: async () => ({
                choices: [{ message: { parsed: null } }],
              }),
            },
          },
        },
      },
    })

    await expect(provider.extractText({ messageId: 'msg-1', text: 'oi' })).rejects.toThrow(
      /empty structured output/,
    )
  })

  it('non-text extractors are not implemented yet', async () => {
    const provider = new OpenAIExtractionProvider({
      client: {
        beta: {
          chat: {
            completions: {
              parse: async () => ({
                choices: [{ message: { parsed: null } }],
              }),
            },
          },
        },
      },
    })

    await expect(provider.extractImage({ messageId: '1', content: '' })).rejects.toThrow(
      'IMAGE extraction requires storagePath',
    )
    await expect(provider.extractDocument({ messageId: '1', content: '' })).rejects.toThrow(
      'DOCUMENT extraction requires storagePath',
    )
    await expect(provider.extractAudio({ messageId: '1', content: '' })).rejects.toThrow('NOT_IMPLEMENTED')
  })

  it('extractImage returns multimodal metadata and data url payload', async () => {
    const storageRoot = join(process.cwd(), 'storage', 'media')
    await mkdir(storageRoot, { recursive: true })
    await writeFile(join(storageRoot, 'vision-test.pdf'), '%PDF-1.4\nhello')

    const provider = new OpenAIExtractionProvider({
      model: 'gpt-test',
      client: {
        beta: {
          chat: {
            completions: {
              parse: async (input) => {
                expect(Array.isArray(input.messages[1]?.content)).toBe(true)
                expect((input.messages[1]?.content as Array<{ type: string }>)[1]?.type).toBe('image_url')
                return {
                  choices: [
                    {
                      message: {
                        parsed: {
                          type: 'EXPENSE_CANDIDATE',
                          confidence: 0.91,
                          data: {
                            description: 'Combustivel',
                            amount: 120.5,
                            categorySuggestion: null,
                            supplierSuggestion: null,
                            date: null,
                            reason: null,
                            confidence: 0.91,
                          },
                          model: '',
                        },
                      },
                    },
                  ],
                  usage: { prompt_tokens: 123, completion_tokens: 45 },
                }
              },
            },
          },
        },
      },
    })

    const result = await provider.extractDocument({
      messageId: 'msg-doc-1',
      content: 'nota em pdf',
      fileName: 'vision-test.pdf',
      mimeType: 'application/pdf',
      storagePath: 'vision-test.pdf',
    })

    expect(result.sourceType).toBe('DOCUMENT')
    expect(result.tokensInput).toBe(123)
    expect(result.tokensOutput).toBe(45)
    expect(result.storagePath).toBe('vision-test.pdf')
    expect(result.model).toBe('gpt-test')

    await rm(join(storageRoot, 'vision-test.pdf'), { force: true })
  })

  it('extractImage falls back to octet-stream mime type when absent', async () => {
    const storageRoot = join(process.cwd(), 'storage', 'media')
    await mkdir(storageRoot, { recursive: true })
    await writeFile(join(storageRoot, 'vision-test.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]))

    const provider = new OpenAIExtractionProvider({
      client: {
        beta: {
          chat: {
            completions: {
              parse: async (input) => {
                const imagePart = (input.messages[1]?.content as Array<{ type: string; image_url?: { url: string } }>)[1]!
                expect(imagePart).toBeDefined()
                expect(imagePart.image_url?.url.startsWith('data:application/octet-stream;base64,')).toBe(true)
                return {
                  choices: [
                    {
                      message: {
                        parsed: {
                          type: 'UNKNOWN',
                          confidence: 0,
                          data: {
                            description: 'UNKNOWN',
                            amount: 0,
                            categorySuggestion: null,
                            supplierSuggestion: null,
                            date: null,
                            reason: 'unclear',
                            confidence: 0,
                          },
                          model: 'vision-model',
                        },
                      },
                    },
                  ],
                }
              },
            },
          },
        },
      },
    })

    const result = await provider.extractImage({
      messageId: 'msg-img-1',
      content: '',
      storagePath: 'vision-test.jpg',
    })

    expect(result.model).toBe('vision-model')
    await rm(join(storageRoot, 'vision-test.jpg'), { force: true })
  })
})

describe('MockAIExtractionProvider', () => {
  it('returns deterministic expense candidate', async () => {
    const provider = new MockAIExtractionProvider()
    const result = await provider.extractText({ messageId: 'msg-1', text: 'balas 4 reais' })
    expect(result.type).toBe('EXPENSE_CANDIDATE')
    expect(result.data).toMatchObject({ description: 'Balas', amount: 4 })
  })
})
