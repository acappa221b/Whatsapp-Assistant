import type { ArchiveMessageType } from './message-types'
import { unwrapBaileysMessage, type BaileysWrapperKey, type BaileysMessagePayload } from './baileys-message-unwrapper'
import { logRc07 } from '@finance-ai/shared/utils'

export type BaileysMessageContent = {
  conversation?: string
  extendedTextMessage?: { text?: string }
  imageMessage?: {
    caption?: string
    mimetype?: string
    fileLength?: number | Long
    url?: string
  }
  documentMessage?: {
    caption?: string
    fileName?: string
    mimetype?: string
    fileLength?: number | Long
    url?: string
  }
  audioMessage?: { mimetype?: string; seconds?: number }
  pttMessage?: { mimetype?: string; seconds?: number }
  videoMessage?: {
    caption?: string
    mimetype?: string
    fileLength?: number | Long
    url?: string
  }
  stickerMessage?: { mimetype?: string }
  reactionMessage?: { text?: string; key?: { id?: string } }
  contactMessage?: { displayName?: string; vcard?: string }
  contactsArrayMessage?: { contacts?: Array<{ displayName?: string }> }
  locationMessage?: { name?: string; degreesLatitude?: number; degreesLongitude?: number }
  liveLocationMessage?: { caption?: string; degreesLatitude?: number; degreesLongitude?: number }
  pollCreationMessage?: { name?: string; question?: string }
  pollUpdateMessage?: { pollName?: string; vote?: unknown }
  protocolMessage?: { type?: number | string }
  senderKeyDistributionMessage?: unknown
  buttonsResponseMessage?: {
    selectedDisplayText?: string
    selectedButtonId?: string
  }
  templateButtonReplyMessage?: {
    selectedDisplayText?: string
    selectedId?: string
  }
  listResponseMessage?: {
    title?: string
    description?: string
    singleSelectReply?: { selectedRowId?: string }
  }
  interactiveResponseMessage?: {
    body?: { text?: string }
    nativeFlowResponseMessage?: { name?: string; paramsJson?: string }
  }
  ephemeralMessage?: MessageWrapper
  viewOnceMessage?: MessageWrapper
  viewOnceMessageV2?: MessageWrapper
  viewOnceMessageV2Extension?: MessageWrapper
  editedMessage?: MessageWrapper
  documentWithCaptionMessage?: MessageWrapper
  deviceSentMessage?: MessageWrapper
  futureProofMessage?: MessageWrapper
  albumMessage?: MessageWrapper
  [key: string]: unknown
}

type MessageWrapper = { message?: BaileysMessageContent }

type Long = { toNumber?: () => number }

export type { BaileysWrapperKey }
export { unwrapBaileysMessage, unwrapMessageContent, BAILEYS_WRAPPER_KEYS } from './baileys-message-unwrapper'

export type ClassifyBaileysInput = {
  message?: BaileysMessageContent
}

export type ClassifiedBaileysMessage = {
  messageType: ArchiveMessageType
  content: string
  mimeType: string | null
  fileName: string | null
  fileSize: number | null
  mediaUrl: string | null
}

export function unwrapMessageContentForClassification(
  message?: BaileysMessageContent,
): BaileysMessageContent | undefined {
  const result = unwrapBaileysMessage(message as BaileysMessagePayload | undefined)
  if (result.wrappers.length > 0) {
    logRc07('WRAPPER', {
      wrappers: result.wrappers,
      depth: result.depth,
    })
  }
  return result.message as BaileysMessageContent | undefined
}

export function classifyBaileysContent(input: ClassifyBaileysInput): ClassifiedBaileysMessage {
  const message = unwrapMessageContentForClassification(input.message)
  if (!message) {
    logRc07('PARSER', { event: 'empty_message' })
    return emptyClassification('UNKNOWN', '[unclassified]')
  }

  const messageType = detectMessageType(message)
  let content = extractContent(message, messageType)

  if (messageType === 'TEXT' && !content.trim()) {
    const fallback = extractUnknownFallback(message)
    logRc07('PARSER', { event: 'empty_text_reclassified', keys: Object.keys(message) })
    return { ...fallback, messageType: 'UNKNOWN' }
  }

  if (messageType === 'UNKNOWN') {
    logRc07('PARSER', { event: 'unknown_type', keys: Object.keys(message) })
  }

  return {
    messageType,
    content,
    ...extractMediaMetadata(message, messageType),
  }
}

function hasTextContent(message: BaileysMessageContent): boolean {
  const conversation = message.conversation?.trim()
  const extended = message.extendedTextMessage?.text?.trim()
  const buttonText = message.buttonsResponseMessage?.selectedDisplayText?.trim()
  const templateReply = message.templateButtonReplyMessage?.selectedDisplayText?.trim()
  const interactiveBody = message.interactiveResponseMessage?.body?.text?.trim()
  const interactiveNative = message.interactiveResponseMessage?.nativeFlowResponseMessage?.name?.trim()
  return Boolean(conversation || extended || buttonText || templateReply || interactiveBody || interactiveNative)
}

function detectMessageType(message: BaileysMessageContent): ArchiveMessageType {
  if (hasTextContent(message)) return 'TEXT'
  if (message.buttonsResponseMessage?.selectedDisplayText?.trim()) return 'TEXT'
  if (message.templateButtonReplyMessage?.selectedDisplayText?.trim()) return 'TEXT'
  if (
    message.listResponseMessage?.title?.trim() ||
    message.listResponseMessage?.description?.trim() ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId?.trim()
  ) {
    return 'TEXT'
  }
  if (
    message.interactiveResponseMessage?.body?.text?.trim() ||
    message.interactiveResponseMessage?.nativeFlowResponseMessage?.name?.trim()
  ) {
    return 'TEXT'
  }
  if (message.audioMessage || message.pttMessage) return 'AUDIO'
  if (message.imageMessage) return 'IMAGE'
  if (message.videoMessage) return 'VIDEO'
  if (message.documentMessage) return 'DOCUMENT'
  if (message.stickerMessage) return 'STICKER'
  if (message.reactionMessage) return 'REACTION'
  if (message.contactMessage || message.contactsArrayMessage) return 'CONTACT'
  if (message.locationMessage || message.liveLocationMessage) return 'LOCATION'
  if (message.pollCreationMessage || message.pollUpdateMessage) return 'POLL'
  if (message.protocolMessage || message.senderKeyDistributionMessage) return 'SYSTEM'
  return 'UNKNOWN'
}

function extractContent(message: BaileysMessageContent, type: ArchiveMessageType): string {
  switch (type) {
    case 'TEXT': {
      const conversation = message.conversation?.trim()
      if (conversation) return conversation
      const extended = message.extendedTextMessage?.text?.trim()
      if (extended) return extended
      const buttonText = message.buttonsResponseMessage?.selectedDisplayText?.trim()
      if (buttonText) return buttonText
      const templateText = message.templateButtonReplyMessage?.selectedDisplayText?.trim()
      if (templateText) return templateText
      const listTitle = message.listResponseMessage?.title?.trim()
      if (listTitle) return listTitle
      const listDescription = message.listResponseMessage?.description?.trim()
      if (listDescription) return listDescription
      const rowId = message.listResponseMessage?.singleSelectReply?.selectedRowId?.trim()
      if (rowId) return rowId
      const interactiveBody = message.interactiveResponseMessage?.body?.text?.trim()
      if (interactiveBody) return interactiveBody
      return message.interactiveResponseMessage?.nativeFlowResponseMessage?.name?.trim() ?? ''
    }
    case 'IMAGE':
      return message.imageMessage?.caption?.trim() || '[image]'
    case 'VIDEO':
      return message.videoMessage?.caption?.trim() || '[video]'
    case 'DOCUMENT': {
      const caption = message.documentMessage?.caption?.trim()
      if (caption) return caption
      return message.documentMessage?.fileName?.trim() || '[document]'
    }
    case 'AUDIO':
      return '[audio]'
    case 'STICKER':
      return '[sticker]'
    case 'REACTION':
      return message.reactionMessage?.text?.trim() || '[reaction]'
    case 'CONTACT':
      return (
        message.contactMessage?.displayName?.trim() ||
        message.contactsArrayMessage?.contacts?.[0]?.displayName?.trim() ||
        '[contact]'
      )
    case 'LOCATION': {
      const loc = message.locationMessage
      const live = message.liveLocationMessage
      const name = loc?.name?.trim() || live?.caption?.trim()
      if (name) return name
      const lat = loc?.degreesLatitude ?? live?.degreesLatitude
      const lng = loc?.degreesLongitude ?? live?.degreesLongitude
      if (lat != null && lng != null) {
        return `${lat},${lng}`
      }
      return '[location]'
    }
    case 'POLL':
      return (
        message.pollCreationMessage?.name?.trim() ||
        message.pollCreationMessage?.question?.trim() ||
        message.pollUpdateMessage?.pollName?.trim() ||
        '[poll]'
      )
    case 'SYSTEM':
      return `[system:${String(message.protocolMessage?.type ?? 'event')}]`
    case 'UNKNOWN':
    default:
      return extractUnknownFallback(message).content
  }
}

function extractUnknownFallback(message: BaileysMessageContent): ClassifiedBaileysMessage {
  const keys = Object.keys(message).filter((key) => !key.startsWith('_'))
  const hint = keys.length > 0 ? keys.join(',') : 'empty'
  return emptyClassification('UNKNOWN', `[unclassified:${hint}]`)
}

function emptyClassification(
  messageType: ArchiveMessageType,
  content: string,
): ClassifiedBaileysMessage {
  return {
    messageType,
    content,
    mediaUrl: null,
    mimeType: null,
    fileName: null,
    fileSize: null,
  }
}

function extractMediaMetadata(
  message: BaileysMessageContent,
  type: ArchiveMessageType,
): {
  mediaUrl: string | null
  mimeType: string | null
  fileName: string | null
  fileSize: number | null
} {
  if (type === 'IMAGE') {
    const image = message.imageMessage
    return {
      mediaUrl: image?.url ?? null,
      mimeType: image?.mimetype ?? null,
      fileName: null,
      fileSize: normalizeFileLength(image?.fileLength),
    }
  }

  if (type === 'VIDEO') {
    const video = message.videoMessage
    return {
      mediaUrl: video?.url ?? null,
      mimeType: video?.mimetype ?? null,
      fileName: null,
      fileSize: normalizeFileLength(video?.fileLength),
    }
  }

  if (type === 'DOCUMENT') {
    return {
      mediaUrl: message.documentMessage?.url ?? null,
      mimeType: message.documentMessage?.mimetype ?? null,
      fileName: message.documentMessage?.fileName ?? null,
      fileSize: normalizeFileLength(message.documentMessage?.fileLength),
    }
  }

  if (type === 'AUDIO') {
    const audio = message.audioMessage ?? message.pttMessage
    return {
      mediaUrl: null,
      mimeType: (audio as { mimetype?: string } | undefined)?.mimetype ?? null,
      fileName: null,
      fileSize: null,
    }
  }

  if (type === 'STICKER') {
    return {
      mediaUrl: null,
      mimeType: (message.stickerMessage as { mimetype?: string } | undefined)?.mimetype ?? null,
      fileName: null,
      fileSize: null,
    }
  }

  return { mediaUrl: null, mimeType: null, fileName: null, fileSize: null }
}

function normalizeFileLength(value: number | Long | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value && typeof value.toNumber === 'function') {
    const normalized = value.toNumber()
    return Number.isFinite(normalized) ? normalized : null
  }
  return null
}
