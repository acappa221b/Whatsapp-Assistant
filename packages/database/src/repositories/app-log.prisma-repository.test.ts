import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { AppLogPrismaRepository } from './app-log.prisma-repository'

describe('AppLogPrismaRepository (unit, RC-20)', () => {
  const prisma = {
    appLog: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
  } as unknown as PrismaClient
  const repository = new AppLogPrismaRepository(prisma)
  const now = new Date('2026-06-30T12:00:00Z')

  beforeEach(() => vi.clearAllMocks())

  it('append creates log row', async () => {
    vi.mocked(prisma.appLog.create).mockResolvedValue({
      id: 'log-1',
      level: 'error',
      domain: 'api',
      message: 'failed',
      metadata: null,
      source: 'app',
      createdAt: now,
    })
    vi.mocked(prisma.appLog.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.appLog.count).mockResolvedValue(1)

    const saved = await repository.append({
      level: 'error',
      domain: 'api',
      message: 'failed',
    })
    expect(saved.level).toBe('error')
    expect(prisma.appLog.create).toHaveBeenCalled()
  })

  it('appendMany batches inserts', async () => {
    vi.mocked(prisma.appLog.createMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.appLog.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.appLog.count).mockResolvedValue(2)
    await expect(
      repository.appendMany([
        { level: 'info', domain: 'system', message: 'a' },
        { level: 'error', domain: 'api', message: 'b' },
      ]),
    ).resolves.toBe(2)
  })

  it('list filters by level error', async () => {
    vi.mocked(prisma.appLog.findMany).mockResolvedValue([])
    await repository.list({ level: 'error', limit: 50 })
    expect(prisma.appLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { level: 'error' },
        take: 50,
      }),
    )
  })

  it('clear deletes all rows', async () => {
    vi.mocked(prisma.appLog.deleteMany).mockResolvedValue({ count: 3 })
    await expect(repository.clear()).resolves.toBe(3)
  })
})
