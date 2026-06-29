import type { EventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import { formatPhotoContent } from '@finance-ai/shared/utils'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { RecordApiTokenUsageUseCase } from '../../api-token-usage/application/record-api-token-usage.use-case'
import { resolve } from 'node:path'
import { config } from '@finance-ai/shared/config'

export type VisionProvider = {
  describeImage(filePath: string, prompt?: string): Promise<{
    text: string
    tokensInput: number
    tokensOutput: number
    model: string
  }>
}

export type ImageDownloadPort = {
  downloadImage(input: {
    externalMessageId: string
    chatId: string
    displayName: string | null
    storageDir: string | null
    mimeType?: string | null
    fileName?: string | null
  }): Promise<{ absolutePath: string; storagePath: string }>
}

export class ProcessPhotoUseCase {
  constructor(
    private readonly chatConfigRepository: WhatsappChatConfigRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly mediaDownloader: ImageDownloadPort,
    private readonly visionProvider: VisionProvider,
    private readonly recordTokenUsage: RecordApiTokenUsageUseCase,
    private readonly eventBus: EventBus,
  ) {}

  async execute(messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId)
    if (!message || message.fromMe || message.messageType !== 'IMAGE') return

    const chatConfig = await this.chatConfigRepository.findByChatId(message.chatId)
    if (!chatConfig?.archiveEnabled || !chatConfig.photoProcessingEnabled) return

    const stored = message.storagePath
      ? { absolutePath: resolve(config.storage.mediaPath, message.storagePath), storagePath: message.storagePath }
      : await this.mediaDownloader.downloadImage({
          externalMessageId: message.externalMessageId,
          chatId: message.chatId,
          displayName: chatConfig.name,
          storageDir: chatConfig.storageDir,
          mimeType: message.mimeType,
          fileName: message.fileName,
        })

    const vision = await this.visionProvider.describeImage(
      stored.absolutePath,
      'Descreva brevemente esta imagem em português brasileiro para contexto de chat.',
    )

    const originalCaption = message.content.trim()
    const content = formatPhotoContent(vision.text, originalCaption || null)
    await this.messageRepository.updateContent(messageId, content)

    await this.recordTokenUsage.execute({
      category: 'photo_processing',
      chatId: message.chatId,
      messageId,
      model: vision.model,
      provider: vision.model.startsWith('gemini') ? 'gemini' : 'openai',
      tokensInput: vision.tokensInput,
      tokensOutput: vision.tokensOutput,
    })

    await this.eventBus.publish({
      name: DomainEvents.PhotoProcessingCompleted,
      payload: { messageId, chatId: message.chatId, content },
      occurredAt: new Date(),
    })

    console.info('[ProcessPhoto] completed', { messageId, chatId: message.chatId })
  }
}
