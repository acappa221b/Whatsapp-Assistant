import type {
  CreateExtractionUseCase,
  ExtractAudioCandidateUseCase,
  ExtractDocumentCandidateUseCase,
  ExtractImageCandidateUseCase,
  ExtractTextCandidateUseCase,
} from '../../../extraction'
import { ValidationError } from '@finance-ai/shared/errors'
import { logImageFidelity, logAudioFidelity, logRc07 } from '@finance-ai/shared/utils'
import type { MessageProcessor, MessageProcessorInput } from '../../domain/message-processor'
import type { ProcessingResult } from '../../domain/processing-result'

type MediaDownloader = {
  downloadImage(input: {
    externalMessageId: string
    chatId?: string | null
    displayName?: string | null
    storageDir?: string | null
    messageType?: string
    mimeType?: string | null
    fileName?: string | null
  }): Promise<{
    mimeType: string
    fileName: string
    fileSize: number
    storagePath: string
    absolutePath: string
  }>
  downloadDocument(input: {
    externalMessageId: string
    chatId?: string | null
    displayName?: string | null
    storageDir?: string | null
    messageType?: string
    mimeType?: string | null
    fileName?: string | null
  }): Promise<{
    mimeType: string
    fileName: string
    fileSize: number
    storagePath: string
    absolutePath: string
  }>
}

function createResult(
  processor: string,
  input: MessageProcessorInput,
  status: ProcessingResult['status'],
  metadata: Record<string, unknown>,
  error?: string,
): ProcessingResult {
  return {
    messageId: input.messageId,
    processor,
    status,
    metadata,
    processedAt: new Date(),
    error,
  }
}

function createNotImplementedResult(processor: string, input: MessageProcessorInput): ProcessingResult {
  return createResult(
    processor,
    input,
    'FAILED',
    { reason: 'NOT_IMPLEMENTED', messageType: input.messageType },
    'NOT_IMPLEMENTED',
  )
}

function createExtractionMetadata(
  extraction: {
    id: string
    type: string
    confidence: number
    model: string
    sourceType?: string
    processingTimeMs?: number | null
    tokensInput?: number | null
    tokensOutput?: number | null
    storagePath?: string | null
  },
  input: MessageProcessorInput,
): Record<string, unknown> {
  return {
    extractionId: extraction.id,
    extractionType: extraction.type,
    confidence: extraction.confidence,
    model: extraction.model,
    sourceType: extraction.sourceType ?? input.messageType,
    processingTimeMs: extraction.processingTimeMs ?? null,
    tokensInput: extraction.tokensInput ?? null,
    tokensOutput: extraction.tokensOutput ?? null,
    storagePath: extraction.storagePath ?? input.storagePath ?? null,
    mediaUrl: input.mediaUrl ?? null,
    mimeType: input.mimeType ?? null,
    fileName: input.fileName ?? null,
    fileSize: input.fileSize ?? null,
  }
}

export class TextMessageProcessor implements MessageProcessor {
  readonly name = 'TextMessageProcessor'

  constructor(private readonly extractTextCandidateUseCase: ExtractTextCandidateUseCase) {}

  canProcess(messageType: string): boolean {
    return messageType === 'TEXT'
  }

  async process(input: MessageProcessorInput): Promise<ProcessingResult> {
    const extraction = await this.extractTextCandidateUseCase.execute({
      messageId: input.messageId,
      text: input.content,
    })

    return createResult(
      this.name,
      input,
      extraction.type === 'UNKNOWN' ? 'SKIPPED' : 'PROCESSED',
      createExtractionMetadata(extraction, input),
    )
  }
}

export class ImageMessageProcessor implements MessageProcessor {
  readonly name = 'ImageMessageProcessor'

  constructor(
    private readonly extractImageCandidateUseCase: ExtractImageCandidateUseCase,
    private readonly createExtractionUseCase: CreateExtractionUseCase,
    private readonly mediaDownloader: MediaDownloader,
  ) {}

  canProcess(messageType: string): boolean {
    return messageType === 'IMAGE'
  }

  async process(input: MessageProcessorInput): Promise<ProcessingResult> {
    return processMediaMessage({
      processorName: this.name,
      input,
      messageType: 'IMAGE',
      mediaDownloader: this.mediaDownloader,
      createExtractionUseCase: this.createExtractionUseCase,
      extract: async (storedMedia) =>
        this.extractImageCandidateUseCase.execute({
          messageId: input.messageId,
          content: input.content,
          mediaUrl: input.mediaUrl,
          mimeType: storedMedia.mimeType,
          fileName: storedMedia.fileName,
          fileSize: storedMedia.fileSize,
          storagePath: storedMedia.storagePath,
        }),
    })
  }
}

export class DocumentMessageProcessor implements MessageProcessor {
  readonly name = 'DocumentMessageProcessor'

  constructor(
    private readonly extractDocumentCandidateUseCase: ExtractDocumentCandidateUseCase,
    private readonly createExtractionUseCase: CreateExtractionUseCase,
    private readonly mediaDownloader: MediaDownloader,
  ) {}

  canProcess(messageType: string): boolean {
    return messageType === 'DOCUMENT'
  }

  async process(input: MessageProcessorInput): Promise<ProcessingResult> {
    return processMediaMessage({
      processorName: this.name,
      input,
      messageType: 'DOCUMENT',
      mediaDownloader: this.mediaDownloader,
      createExtractionUseCase: this.createExtractionUseCase,
      extract: async (storedMedia) =>
        this.extractDocumentCandidateUseCase.execute({
          messageId: input.messageId,
          content: input.content,
          mediaUrl: input.mediaUrl,
          mimeType: storedMedia.mimeType,
          fileName: storedMedia.fileName,
          fileSize: storedMedia.fileSize,
          storagePath: storedMedia.storagePath,
        }),
    })
  }
}

export class AudioMessageProcessor implements MessageProcessor {
  readonly name = 'AudioMessageProcessor'

  constructor(private readonly _extractAudioCandidateUseCase?: ExtractAudioCandidateUseCase) {}

  canProcess(messageType: string): boolean {
    return messageType === 'AUDIO'
  }

  async process(input: MessageProcessorInput): Promise<ProcessingResult> {
    logAudioFidelity({
      stage: 'audit_start',
      messageId: input.messageId,
      externalMessageId: input.externalMessageId,
      mimeType: input.mimeType,
      durationSeconds: null,
      fileSize: input.fileSize,
      storagePath: input.storagePath,
    })
    logRc07('AUDIO', {
      event: 'awaiting_whisper',
      messageId: input.messageId,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
    })
    logAudioFidelity({
      stage: 'awaiting_whisper',
      messageId: input.messageId,
      externalMessageId: input.externalMessageId,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storagePath: input.storagePath,
    })
    return createNotImplementedResult(this.name, input)
  }
}

export class UnknownMessageProcessor implements MessageProcessor {
  readonly name = 'UnknownMessageProcessor'

  canProcess(): boolean {
    return true
  }

  async process(input: MessageProcessorInput): Promise<ProcessingResult> {
    return createResult(this.name, input, 'SKIPPED', {
      reason: 'UNKNOWN_MESSAGE_TYPE',
      messageType: input.messageType,
    })
  }
}

async function processMediaMessage(args: {
  processorName: string
  input: MessageProcessorInput
  messageType: 'IMAGE' | 'DOCUMENT'
  mediaDownloader: MediaDownloader
  createExtractionUseCase: CreateExtractionUseCase
  extract: (storedMedia: {
    mimeType: string
    fileName: string
    fileSize: number
    storagePath: string
    absolutePath: string
  }) => Promise<{
    id: string
    type: string
    confidence: number
    model: string
    sourceType: string
    processingTimeMs: number | null
    tokensInput: number | null
    tokensOutput: number | null
    storagePath: string | null
  }>
}): Promise<ProcessingResult> {
  const { processorName, input, messageType, mediaDownloader, createExtractionUseCase, extract } = args

  try {
    logImageFidelity({
      stage: 'download_start',
      messageId: input.messageId,
      externalMessageId: input.externalMessageId,
      mimeType: input.mimeType,
      hasCaption: Boolean(input.content?.trim() && input.content !== '[image]'),
    })
    const storedMedia =
      messageType === 'IMAGE'
        ? await mediaDownloader.downloadImage({
            externalMessageId: input.externalMessageId,
            chatId: input.chatId,
            displayName: input.chatDisplayName,
            storageDir: input.chatStorageDir,
            messageType,
            mimeType: input.mimeType,
            fileName: input.fileName,
          })
        : await mediaDownloader.downloadDocument({
            externalMessageId: input.externalMessageId,
            chatId: input.chatId,
            displayName: input.chatDisplayName,
            storageDir: input.chatStorageDir,
            messageType,
            mimeType: input.mimeType,
            fileName: input.fileName,
          })

    logImageFidelity({
      stage: 'download_ok',
      messageId: input.messageId,
      externalMessageId: input.externalMessageId,
      mimeType: storedMedia.mimeType,
    })

    logImageFidelity({
      stage: 'extract_start',
      messageId: input.messageId,
      externalMessageId: input.externalMessageId,
    })
    const extraction = await extract(storedMedia)
    logImageFidelity({
      stage: extraction.type === 'UNKNOWN' ? 'extract_empty' : 'extract_ok',
      messageId: input.messageId,
      externalMessageId: input.externalMessageId,
      extractionType: extraction.type,
    })
    return createResult(
      processorName,
      input,
      extraction.type === 'UNKNOWN' ? 'SKIPPED' : 'PROCESSED',
      {
        ...createExtractionMetadata(extraction, {
          ...input,
          mimeType: storedMedia.mimeType,
          fileName: storedMedia.fileName,
          fileSize: storedMedia.fileSize,
          storagePath: storedMedia.storagePath,
        }),
        mediaDownloaded: true,
        mediaStored: true,
      },
    )
  } catch (error) {
    logImageFidelity({
      stage: messageType === 'IMAGE' ? 'download_failed' : 'extract_failed',
      messageId: input.messageId,
      externalMessageId: input.externalMessageId,
      error: error instanceof Error ? error.message : String(error),
    })
    if (error instanceof ValidationError) {
      const extraction = await createExtractionUseCase.execute({
        messageId: input.messageId,
        type: 'UNKNOWN',
        sourceType: messageType,
        confidence: 0,
        data: { reason: error.message },
        processingTimeMs: 0,
        tokensInput: null,
        tokensOutput: null,
        storagePath: input.storagePath ?? null,
        model: 'system-media-validator',
      })

      return createResult(
        processorName,
        input,
        'SKIPPED',
        {
          ...createExtractionMetadata(extraction, input),
          reason: error.message,
          mediaUnsupported: true,
        },
      )
    }

    throw error
  }
}
