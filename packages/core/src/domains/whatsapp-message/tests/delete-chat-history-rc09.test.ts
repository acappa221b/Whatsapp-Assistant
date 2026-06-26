import { describe, expect, it, vi } from 'vitest'
import { mkdtemp, readdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ChatMediaStorage } from '@finance-ai/shared/storage'
import { WhatsappChatConfig } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.entity'
import { InMemoryWhatsappChatConfigRepository } from '../../whatsapp-chat-config/infrastructure/in-memory-whatsapp-chat-config.repository'
import { WhatsappMessage } from '../domain/whatsapp-message.entity'
import { DeleteChatHistoryUseCase } from '../application/delete-chat-history.use-case'
import { InMemoryWhatsappMessageRepository } from '../infrastructure/in-memory-whatsapp-message.repository'
import { InMemoryEventBus } from '../../../events/index'
import { DomainEvents } from '../../../events/index'

describe('DeleteChatHistoryUseCase (RC-09 directory cleanup)', () => {
  it('removes chat media directory recursively', async () => {
    const root = await mkdtemp(join(tmpdir(), 'rc09-delete-'))
    const storage = new ChatMediaStorage(root)
    const chatId = '120363421372276062@g.us'
    const name = 'Ferramentaria Apcom'
    const chatDir = await storage.ensureChatStructure(chatId, name)
    const photoPath = await storage.resolvePath(chatId, name, 'photos', 'img.jpg', chatDir)
    await writeFile(photoPath.absolutePath, 'bytes')

    const messageRepository = new InMemoryWhatsappMessageRepository()
    const chatConfigRepository = new InMemoryWhatsappChatConfigRepository()
    await chatConfigRepository.save(
      WhatsappChatConfig.create({
        chatId,
        name,
        storageDir: chatDir,
        archiveEnabled: true,
      }),
    )
    await messageRepository.save(
      WhatsappMessage.create({
        id: 'wa-1',
        externalMessageId: 'ext-1',
        chatId,
        sender: 'x',
        senderId: 'x',
        content: 'hi',
        messageType: 'TEXT',
        rawPayload: {},
        receivedAt: new Date(),
      }).withStoredMedia({
        mimeType: 'image/jpeg',
        fileName: 'img.jpg',
        fileSize: 5,
        storagePath: photoPath.storagePath,
      }),
    )

    const useCase = new DeleteChatHistoryUseCase(
      messageRepository,
      chatConfigRepository,
      {
        deleteFile: vi.fn(async () => true),
        deleteChatDirectory: async (input) =>
          storage.deleteChatDirectory(input.chatId, input.displayName ?? 'chat', input.storageDir),
      },
      new InMemoryEventBus(),
    )

    const result = await useCase.execute(chatId)
    expect(result.deletedMessages).toBe(1)
    expect(result.deletedMediaFiles).toBeGreaterThan(0)

    await expect(stat(join(root, chatDir))).rejects.toThrow()
    const rootEntries = await readdir(root)
    expect(rootEntries.filter((entry) => entry === chatDir)).toHaveLength(0)

    const config = await chatConfigRepository.findByChatId(chatId)
    expect(config?.storageDir).toBeNull()
    expect(config?.archiveEnabled).toBe(false)
  })
})
