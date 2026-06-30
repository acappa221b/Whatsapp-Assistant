import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { AiProviderConfigPrismaRepository } from './ai-provider-config.prisma-repository'

describe('AiProviderConfigPrismaRepository (unit, RC-19)', () => {
  const prisma = {
    aiProviderConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient
  const repository = new AiProviderConfigPrismaRepository(prisma)
  const now = new Date('2026-06-30T12:00:00Z')

  beforeEach(() => vi.clearAllMocks())

  it('create persists provider row', async () => {
    vi.mocked(prisma.aiProviderConfig.create).mockResolvedValue({
      id: 'prov-1',
      provider: 'gemini',
      displayName: 'Gemini',
      apiKeyEnc: 'enc:key',
      model: null,
      baseUrl: null,
      isDefault: false,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    })
    const created = await repository.create({
      provider: 'gemini',
      displayName: 'Gemini',
      apiKeyEnc: 'enc:key',
    })
    expect(created.provider).toBe('gemini')
    expect(prisma.aiProviderConfig.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ provider: 'gemini', displayName: 'Gemini' }),
      }),
    )
  })

  it('update can replace apiKeyEnc', async () => {
    vi.mocked(prisma.aiProviderConfig.update).mockResolvedValue({
      id: 'prov-1',
      provider: 'openai',
      displayName: 'OpenAI',
      apiKeyEnc: 'enc:new-key',
      model: null,
      baseUrl: null,
      isDefault: false,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    })
    const updated = await repository.update('prov-1', { apiKeyEnc: 'enc:new-key' })
    expect(updated.apiKeyEnc).toBe('enc:new-key')
  })

  it('findAll returns mapped rows', async () => {
    vi.mocked(prisma.aiProviderConfig.findMany).mockResolvedValue([])
    await expect(repository.findAll()).resolves.toEqual([])
    expect(prisma.aiProviderConfig.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } })
  })
})
