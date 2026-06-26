import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { WhatsappMessage } from '@finance-ai/core/domains/whatsapp-message'
import { WhatsappMessagePrismaRepository } from './whatsapp-message.prisma-repository'

const now = new Date('2025-06-01T10:00:00Z')

function createMessage(overrides: Partial<{ processed: boolean }> = {}) {
  return WhatsappMessage.create({
    id: 'wa-1',
    externalMessageId: 'ext-1',
    chatId: '5511@s.whatsapp.net',
    sender: '5511@s.whatsapp.net',
    senderId: '5511@s.whatsapp.net',
    content: 'Hello',
    messageType: 'TEXT',
    rawPayload: { key: { id: 'ext-1' } },
    receivedAt: new Date('2025-06-01T12:00:00Z'),
    now,
    ...overrides,
  })
}

describe('WhatsappMessagePrismaRepository (unit)', () => {
  const prisma = {
    whatsappMessage: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    whatsappChatConfig: {
      findMany: vi.fn(),
    },
  } as unknown as PrismaClient
  const repository = new WhatsappMessagePrismaRepository(prisma)

  beforeEach(() => vi.clearAllMocks())

  it('findById returns null when missing', async () => {
    vi.mocked(prisma.whatsappMessage.findUnique).mockResolvedValue(null)
    await expect(repository.findById('missing')).resolves.toBeNull()
  })

  it('findByExternalMessageId returns null when missing', async () => {
    vi.mocked(prisma.whatsappMessage.findUnique).mockResolvedValue(null)
    await expect(repository.findByExternalMessageId('missing')).resolves.toBeNull()
  })

  it('findMany applies chatId filter', async () => {
    vi.mocked(prisma.whatsappMessage.findMany).mockResolvedValue([])
    vi.mocked(prisma.whatsappMessage.count).mockResolvedValue(0)
    await repository.findMany({ chatId: '553591215342-1607379398@g.us' }, { page: 1, limit: 10 })
    expect(prisma.whatsappMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chatId: '553591215342-1607379398@g.us' },
      }),
    )
    expect(prisma.whatsappMessage.count).toHaveBeenCalledWith({
      where: { chatId: '553591215342-1607379398@g.us' },
    })
  })

  it('findMany applies optional filters', async () => {
    vi.mocked(prisma.whatsappMessage.findMany).mockResolvedValue([])
    vi.mocked(prisma.whatsappMessage.count).mockResolvedValue(0)
    await repository.findMany(
      { processed: false, messageType: 'IMAGE' },
      { page: 2, limit: 5 },
    )
    expect(prisma.whatsappMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { processed: false, messageType: 'IMAGE' },
        skip: 5,
        take: 5,
      }),
    )
  })

  it('count applies filters', async () => {
    vi.mocked(prisma.whatsappMessage.count).mockResolvedValue(3)
    await expect(repository.count({ processed: true })).resolves.toBe(3)
    expect(prisma.whatsappMessage.count).toHaveBeenCalledWith({ where: { processed: true } })
  })

  it('save maps domain entity', async () => {
    const message = createMessage().withStoredMedia({
      mimeType: 'image/jpeg',
      fileName: 'receipt.jpg',
      fileSize: 128,
      storagePath: 'receipt.jpg',
    })
    vi.mocked(prisma.whatsappMessage.upsert).mockResolvedValue({
      id: message.id,
      externalMessageId: message.externalMessageId,
      chatId: message.chatId,
      chatName: message.chatName,
      sender: message.sender,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      messageType: message.messageType,
      rawPayload: message.rawPayload,
      mediaUrl: message.mediaUrl,
      mimeType: message.mimeType,
      fileName: message.fileName,
      fileSize: message.fileSize,
      storagePath: message.storagePath,
      fromMe: message.fromMe,
      processed: message.processed,
      receivedAt: message.receivedAt,
      createdAt: message.createdAt,
    })
    const saved = await repository.save(message)
    expect(saved.id).toBe('wa-1')
    expect(saved.storagePath).toBe('receipt.jpg')
  })

  it('listChatSummaries excludes chats without archiveEnabled', async () => {
    vi.mocked(prisma.whatsappMessage.groupBy).mockResolvedValue([
      {
        chatId: 'enabled@g.us',
        _count: { _all: 2 },
        _max: { receivedAt: new Date('2025-06-01T12:00:00Z') },
      },
      {
        chatId: 'disabled@g.us',
        _count: { _all: 1 },
        _max: { receivedAt: new Date('2025-06-01T11:00:00Z') },
      },
    ] as never)
    vi.mocked(prisma.whatsappChatConfig.findMany).mockResolvedValue([
      {
        chatId: 'enabled@g.us',
        name: 'Enabled',
        archiveEnabled: true,
        aiProcessingEnabled: false,
        agentChatEnabled: false,
        updatedAt: now,
      },
      {
        chatId: 'disabled@g.us',
        name: 'Disabled',
        archiveEnabled: false,
        aiProcessingEnabled: false,
        agentChatEnabled: false,
        updatedAt: now,
      },
    ] as never)
    vi.mocked(prisma.whatsappMessage.findFirst).mockResolvedValue({
      id: 'wa-1',
      externalMessageId: 'ext-1',
      chatId: 'enabled@g.us',
      chatName: 'Enabled',
      sender: 'x',
      senderId: 'x',
      senderName: null,
      content: 'Hi',
      messageType: 'TEXT',
      rawPayload: {},
      mediaUrl: null,
      mimeType: null,
      fileName: null,
      fileSize: null,
      storagePath: null,
      fromMe: false,
      processed: false,
      receivedAt: new Date('2025-06-01T12:00:00Z'),
      createdAt: now,
    } as never)

    const summaries = await repository.listChatSummaries()
    expect(summaries).toHaveLength(1)
    expect(summaries[0]?.chatId).toBe('enabled@g.us')
  })
})
