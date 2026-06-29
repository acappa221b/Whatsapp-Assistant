import type { EventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import { formatAudioContent } from '@finance-ai/shared/utils'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { RecordApiTokenUsageUseCase } from '../../api-token-usage/application/record-api-token-usage.use-case'
import { writeFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config } from '@finance-ai/shared/config'

export type AudioTranscriptionProvider = {
  transcribeAudio(filePath: string): Promise<{
    text: string
    tokensInput: number
    tokensOutput: number
    model: string
  }>
}

export type MediaDownloadPort = {
  downloadAudio(input: {
    externalMessageId: string
    chatId: string
    displayName: string | null
    storageDir: string | null
    mimeType?: string | null
    fileName?: string | null
  }): Promise<{ absolutePath: string; storagePath: string }>
}

export class TranscribeAudioUseCase {
  constructor(
    private readonly chatConfigRepository: WhatsappChatConfigRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly mediaDownloader: MediaDownloadPort,
    private readonly transcriptionProvider: AudioTranscriptionProvider,
    private readonly recordTokenUsage: RecordApiTokenUsageUseCase,
    private readonly eventBus: EventBus,
  ) {}

  async execute(messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId)
    if (!message || message.fromMe || message.messageType !== 'AUDIO') return

    const chatConfig = await this.chatConfigRepository.findByChatId(message.chatId)
    if (!chatConfig?.archiveEnabled || !chatConfig.audioProcessingEnabled) return

    const stored = message.storagePath
      ? { absolutePath: resolve(config.storage.mediaPath, message.storagePath), storagePath: message.storagePath }
      : await this.mediaDownloader.downloadAudio({
          externalMessageId: message.externalMessageId,
          chatId: message.chatId,
          displayName: chatConfig.name,
          storageDir: chatConfig.storageDir,
          mimeType: message.mimeType,
          fileName: message.fileName ?? `${message.id}.ogg`,
        })

    const result = await this.transcriptionProvider.transcribeAudio(stored.absolutePath)
    const content = formatAudioContent(result.text)

    await this.messageRepository.updateContent(messageId, content)

    const transcriptPath = stored.storagePath.replace(/\/audio\//, '/messages/').replace(/\.[^.]+$/, '.transcription.txt')
    const transcriptAbsolute = resolve(config.storage.mediaPath, transcriptPath)
    await writeFile(transcriptAbsolute, result.text, 'utf8').catch(() => undefined)

    let audioDurationSec: number | undefined
    if (result.tokensInput + result.tokensOutput === 0) {
      try {
        const fileStat = await stat(stored.absolutePath)
        audioDurationSec = Math.max(1, fileStat.size / 16_000)
      } catch {
        audioDurationSec = 30
      }
    }

    const providerName = result.model.includes('whisper') ? 'openai' : undefined

    await this.recordTokenUsage.execute({
      category: 'audio_processing',
      chatId: message.chatId,
      messageId,
      model: result.model,
      provider: providerName,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      audioDurationSec,
    })

    await this.eventBus.publish({
      name: DomainEvents.TranscriptionCompleted,
      payload: { messageId, chatId: message.chatId, content },
      occurredAt: new Date(),
    })

    console.info('[TranscribeAudio] completed', { messageId, chatId: message.chatId })
  }
}
