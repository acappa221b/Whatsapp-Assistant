import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { ValidationError } from '@finance-ai/shared/errors'
import { config } from '@finance-ai/shared/config'
import { ChatMediaStorage, buildChatDirName, resolveMediaCategory } from '@finance-ai/shared/storage'
import { InMemoryWhatsappMediaRegistry, whatsappMediaRegistry } from './media-registry'

export { InMemoryWhatsappMediaRegistry, whatsappMediaRegistry } from './media-registry'

export type SupportedMediaMimeType =
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf'

export type DownloadMediaInput = {
  externalMessageId: string
  chatId?: string | null
  displayName?: string | null
  storageDir?: string | null
  messageType?: string
  mimeType?: string | null
  fileName?: string | null
}

export type StoredMedia = {
  mimeType: SupportedMediaMimeType
  fileName: string
  fileSize: number
  storagePath: string
  absolutePath: string
}

type MediaMessageForDownload = {
  mimetype?: string | null
}

type DownloadContentFromMessage = (
  message: MediaMessageForDownload,
  mediaType: 'image' | 'document',
) => Promise<AsyncIterable<Uint8Array>>

const SUPPORTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const
const SUPPORTED_DOCUMENT_MIME_TYPES = ['application/pdf'] as const
const SUPPORTED_MEDIA_MIME_TYPES = [
  ...SUPPORTED_IMAGE_MIME_TYPES,
  ...SUPPORTED_DOCUMENT_MIME_TYPES,
] as const
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function getExtensionFromMimeType(mimeType: SupportedMediaMimeType): string {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'application/pdf':
      return '.pdf'
  }
}

async function readStreamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
}

function validateFileSignature(buffer: Buffer, mimeType: SupportedMediaMimeType): void {
  if (buffer.length === 0) {
    throw new ValidationError('Media file is empty')
  }

  if (mimeType === 'application/pdf' && buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
    throw new ValidationError('Corrupted PDF file')
  }

  if ((mimeType === 'image/jpeg' || mimeType === 'image/jpg') && !buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) {
    throw new ValidationError('Corrupted JPEG file')
  }

  if (mimeType === 'image/png' && !buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new ValidationError('Corrupted PNG file')
  }

  if (
    mimeType === 'image/webp' &&
    (buffer.subarray(0, 4).toString('ascii') !== 'RIFF' || buffer.subarray(8, 12).toString('ascii') !== 'WEBP')
  ) {
    throw new ValidationError('Corrupted WEBP file')
  }
}

export class MediaDownloader {
  private readonly chatMediaStorage: ChatMediaStorage

  constructor(
    private readonly registry: InMemoryWhatsappMediaRegistry = whatsappMediaRegistry,
    private readonly mediaRootPath = resolve(process.cwd(), config.storage.mediaPath),
    private readonly maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
    chatMediaStorage?: ChatMediaStorage,
  ) {
    this.chatMediaStorage = chatMediaStorage ?? new ChatMediaStorage(mediaRootPath)
  }

  async downloadImage(input: DownloadMediaInput): Promise<StoredMedia> {
    const mimeType = this.validateMimeType(input.mimeType, 'IMAGE')
    const buffer = await this.downloadMediaBuffer(input.externalMessageId, 'image')
    return this.saveMedia(buffer, mimeType, input.fileName, input.externalMessageId, {
      ...input,
      messageType: input.messageType ?? 'IMAGE',
    })
  }

  async downloadDocument(input: DownloadMediaInput): Promise<StoredMedia> {
    const mimeType = this.validateMimeType(input.mimeType, 'DOCUMENT')
    const buffer = await this.downloadMediaBuffer(input.externalMessageId, 'document')
    return this.saveMedia(buffer, mimeType, input.fileName, input.externalMessageId, {
      ...input,
      messageType: input.messageType ?? 'DOCUMENT',
    })
  }

  validateMimeType(
    mimeType: string | null | undefined,
    messageType: 'IMAGE' | 'DOCUMENT',
  ): SupportedMediaMimeType {
    if (!mimeType) {
      throw new ValidationError('Media mime type is required')
    }

    if (
      messageType === 'IMAGE' &&
      SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as (typeof SUPPORTED_IMAGE_MIME_TYPES)[number])
    ) {
      return mimeType as SupportedMediaMimeType
    }

    if (
      messageType === 'DOCUMENT' &&
      SUPPORTED_DOCUMENT_MIME_TYPES.includes(mimeType as (typeof SUPPORTED_DOCUMENT_MIME_TYPES)[number])
    ) {
      return mimeType as SupportedMediaMimeType
    }

    throw new ValidationError(`Unsupported media mime type: ${mimeType}`)
  }

  generateStoragePath(
    externalMessageId: string,
    mimeType: SupportedMediaMimeType,
    fileName?: string | null,
    context?: {
      chatId?: string | null
      displayName?: string | null
      storageDir?: string | null
      messageType?: string
    },
  ): {
    storagePath: string
    absolutePath: string
    fileName: string
  } {
    if (fileName && (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\'))) {
      throw new ValidationError('Invalid media file name')
    }

    const extension = extname(fileName ?? '') || getExtensionFromMimeType(mimeType)
    const normalizedName = fileName?.trim()
      ? sanitizePathSegment(fileName.trim())
      : `${sanitizePathSegment(externalMessageId)}${extension}`
    const category = resolveMediaCategory(context?.messageType ?? 'IMAGE', mimeType)

    if (context?.chatId) {
      const displayName = context.displayName?.trim() || 'chat'
      const chatDir = context.storageDir?.trim() || buildChatDirName(displayName, context.chatId)
      const relative = `${chatDir}/${category}/${normalizedName}`.replace(/\\/g, '/')
      // category is photos | reports | audio | messages (RC-09)
      const absolutePath = resolve(this.mediaRootPath, relative)
      if (!absolutePath.startsWith(this.mediaRootPath)) {
        throw new ValidationError('Invalid media storage path')
      }
      return { storagePath: relative, absolutePath, fileName: normalizedName }
    }

    const storagePath = resolve(this.mediaRootPath, normalizedName)
    if (!storagePath.startsWith(this.mediaRootPath)) {
      throw new ValidationError('Invalid media storage path')
    }

    return {
      storagePath: storagePath.slice(this.mediaRootPath.length + 1).replace(/\\/g, '/'),
      absolutePath: storagePath,
      fileName: normalizedName,
    }
  }

  async saveMedia(
    buffer: Buffer,
    mimeType: SupportedMediaMimeType,
    fileName: string | null | undefined,
    externalMessageId: string,
    context?: {
      chatId?: string | null
      displayName?: string | null
      storageDir?: string | null
      messageType?: string
    },
  ): Promise<StoredMedia> {
    if (buffer.length === 0) {
      throw new ValidationError('Media file is empty')
    }
    if (buffer.length > this.maxFileSizeBytes) {
      throw new ValidationError(`Media file exceeds max size of ${this.maxFileSizeBytes} bytes`)
    }

    validateFileSignature(buffer, mimeType)

    const extension = extname(fileName ?? '') || getExtensionFromMimeType(mimeType)
    const normalizedName = fileName?.trim()
      ? sanitizePathSegment(fileName.trim())
      : `${sanitizePathSegment(externalMessageId)}${extension}`
    const category = resolveMediaCategory(context?.messageType ?? 'IMAGE', mimeType)

    let target: { storagePath: string; absolutePath: string; fileName: string }

    if (context?.chatId) {
      const displayName = context.displayName?.trim() || 'chat'
      const resolved = await this.chatMediaStorage.resolvePath(
        context.chatId,
        displayName,
        category,
        normalizedName,
        context.storageDir,
      )
      target = {
        storagePath: resolved.storagePath,
        absolutePath: resolved.absolutePath,
        fileName: normalizedName,
      }
    } else {
      target = this.generateStoragePath(externalMessageId, mimeType, fileName, context)
    }

    await mkdir(this.mediaRootPath, { recursive: true })
    await writeFile(target.absolutePath, buffer)

    return {
      mimeType,
      fileName: target.fileName,
      fileSize: buffer.length,
      storagePath: target.storagePath,
      absolutePath: target.absolutePath,
    }
  }

  private async downloadMediaBuffer(
    externalMessageId: string,
    mediaType: 'image' | 'document',
  ): Promise<Buffer> {
    const rawMessage = this.registry.get(externalMessageId)
    if (!rawMessage?.message) {
      throw new ValidationError(`Media source not found for message ${externalMessageId}`)
    }

    const mediaMessage =
      mediaType === 'image' ? rawMessage.message.imageMessage : rawMessage.message.documentMessage
    if (!mediaMessage) {
      throw new ValidationError(`Message ${externalMessageId} does not contain ${mediaType} media`)
    }

    const { downloadContentFromMessage } = (await import('@whiskeysockets/baileys')) as {
      downloadContentFromMessage: DownloadContentFromMessage
    }
    const stream = await downloadContentFromMessage(mediaMessage, mediaType)
    return readStreamToBuffer(stream)
  }
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export const SUPPORTED_MEDIA_TYPES = SUPPORTED_MEDIA_MIME_TYPES
