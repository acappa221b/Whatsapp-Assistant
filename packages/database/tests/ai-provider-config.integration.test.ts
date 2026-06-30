import { Prisma } from '@prisma/client'
import { decryptSecret, encryptSecret, maskApiKey } from '@finance-ai/shared'
import { AiProviderConfigPrismaRepository } from '@finance-ai/database'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { createIsolatedTestDatabase, resetTestDatabase, type TestDatabase } from './helpers/test-database'

const ENCRYPTION_SECRET = 'test-settings-encryption-secret-rc19'

describe('AiProviderConfigPrismaRepository integration (RC-19)', () => {
  let db: TestDatabase
  let repository: AiProviderConfigPrismaRepository

  beforeAll(() => {
    process.env.SETTINGS_ENCRYPTION_SECRET = ENCRYPTION_SECRET
    db = createIsolatedTestDatabase()
    repository = new AiProviderConfigPrismaRepository(db.prisma)
  })

  beforeEach(async () => {
    await resetTestDatabase(db.prisma)
  })

  afterAll(async () => {
    await db.cleanup()
  })

  async function createProvider(
    provider: 'openai' | 'gemini' | 'deepseek',
    displayName: string,
    apiKey: string,
  ) {
    return repository.create({
      provider,
      displayName,
      apiKeyEnc: encryptSecret(apiKey, ENCRYPTION_SECRET),
    })
  }

  it('persists openai with masked decrypt', async () => {
    const apiKey = 'sk-test-openai-key-12345678'
    const created = await createProvider('openai', 'OpenAI', apiKey)
    const listed = await repository.findAll()
    expect(listed).toHaveLength(1)
    const plain = decryptSecret(listed[0]!.apiKeyEnc, ENCRYPTION_SECRET)
    expect(maskApiKey(plain)).toBe(maskApiKey(apiKey))
    expect(created.provider).toBe('openai')
  })

  it('persists gemini with AIza prefix mask', async () => {
    const apiKey = 'AIzaSyTestGeminiKey1234567890'
    await createProvider('gemini', 'Gemini', apiKey)
    const listed = await repository.findAll()
    const plain = decryptSecret(listed[0]!.apiKeyEnc, ENCRYPTION_SECRET)
    expect(plain).toBe(apiKey)
    expect(maskApiKey(plain)).toMatch(/^AIza\.\.\./)
  })

  it('persists deepseek', async () => {
    const apiKey = 'sk-deepseek-test-key-abcdef'
    await createProvider('deepseek', 'DeepSeek', apiKey)
    const found = await repository.findById((await repository.findAll())[0]!.id)
    expect(found?.provider).toBe('deepseek')
    expect(decryptSecret(found!.apiKeyEnc, ENCRYPTION_SECRET)).toBe(apiKey)
  })

  it('rejects duplicate provider+displayName', async () => {
    await createProvider('gemini', 'Gemini', 'AIzaSyFirstKey1234567890')
    try {
      await createProvider('gemini', 'Gemini', 'AIzaSySecondKey0987654321')
      expect.fail('expected duplicate to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError)
      expect((error as Prisma.PrismaClientKnownRequestError).code).toBe('P2002')
    }
  })

  it('PATCH apiKey updates encrypted value', async () => {
    const created = await createProvider('openai', 'OpenAI', 'sk-old-key-12345678')
    const newKey = 'sk-new-key-87654321'
    const updated = await repository.update(created.id, {
      apiKeyEnc: encryptSecret(newKey, ENCRYPTION_SECRET),
    })
    expect(decryptSecret(updated.apiKeyEnc, ENCRYPTION_SECRET)).toBe(newKey)
  })
})
