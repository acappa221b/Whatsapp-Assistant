/** RC-07/RC-09/RC-22A — bootstrap names after stable connection (message-driven). */
import type { PrismaClient } from '@finance-ai/database'
import type { ContactNameResolver } from '@finance-ai/whatsapp'
import type { BackfillWhatsappMessageNamesUseCase } from '@finance-ai/core/domains/whatsapp-message'
import type {
  EnsureWhatsappChatDiscoveredUseCase,
  ResolveChatNamesUseCase,
} from '@finance-ai/core/domains/whatsapp-chat-config'
import type { WhatsappDiscoveryPolicy } from '@finance-ai/shared'
import { ChatMediaStorage } from '@finance-ai/shared/storage'
import { isGenericDisplayName } from '@finance-ai/shared/utils'

export async function bootstrapWhatsappNames(input: {
  prisma: PrismaClient
  resolver: ContactNameResolver
  ensureChatDiscovered: EnsureWhatsappChatDiscoveredUseCase
  backfillNames: BackfillWhatsappMessageNamesUseCase
  resolveChatNames: ResolveChatNamesUseCase
  chatMediaStorage?: ChatMediaStorage
  discoveryPolicy?: WhatsappDiscoveryPolicy
}): Promise<{
  groupsResolved: number
  rawPayloadUpdated: number
  namesResolved: number
  namesFailed: number
}> {
  const chatMediaStorage = input.chatMediaStorage ?? new ChatMediaStorage()
  const policy = input.discoveryPolicy

  const enabledGroupConfigs = await input.prisma.whatsappChatConfig.findMany({
    where: { chatId: { endsWith: '@g.us' }, archiveEnabled: true },
    select: { chatId: true },
  })

  let groupsResolved = 0
  for (const row of enabledGroupConfigs) {
    const result = await input.resolver.fetchGroupMetadataSync(row.chatId, 10_000)
    if (result.name) {
      groupsResolved += 1
      await input.ensureChatDiscovered.execute(row.chatId, result.name)
      await input.backfillNames.execute({ chatId: row.chatId, chatName: result.name })
    }
  }

  const distinctChatIds = await input.prisma.whatsappMessage.findMany({
    distinct: ['chatId'],
    select: { chatId: true },
  })
  for (const { chatId } of distinctChatIds) {
    const existing = await input.prisma.whatsappChatConfig.findUnique({
      where: { chatId },
      select: { chatId: true },
    })
    if (!existing) {
      await input.ensureChatDiscovered.execute(chatId)
    }
  }

  const configChatIds = await input.prisma.whatsappChatConfig.findMany({
    select: { chatId: true },
  })
  const resolveResult = await input.resolveChatNames.execute({
    chatIds: configChatIds.map((row) => row.chatId),
    onNameResolved: async (chatId, name) => {
      await input.backfillNames.execute({ chatId, chatName: name })
    },
    ensureStorageDir: async (chatId, name, storageDir) =>
      chatMediaStorage.ensureChatStructure(chatId, name, storageDir),
  })

  const rawPayloadUpdated = await backfillNamesFromRawPayload(input.prisma)

  console.info('[RC-22A/name-bootstrap]', {
    groupsResolved,
    syncGroupsEnabled: policy?.syncGroupsEnabled ?? false,
    namesResolved: resolveResult.resolved,
    namesFailed: resolveResult.failed.length,
    rawPayloadUpdated,
  })

  return {
    groupsResolved,
    rawPayloadUpdated,
    namesResolved: resolveResult.resolved,
    namesFailed: resolveResult.failed.length,
  }
}

export async function backfillNamesFromRawPayload(prisma: PrismaClient): Promise<number> {
  const messages = await prisma.whatsappMessage.findMany({
    where: {
      OR: [
        { senderName: null },
        { senderName: '' },
        { chatName: null },
        { chatName: '' },
      ],
    },
    select: {
      id: true,
      chatId: true,
      senderId: true,
      senderName: true,
      chatName: true,
      rawPayload: true,
    },
    take: 5000,
  })

  let updated = 0
  for (const message of messages) {
    const payload = message.rawPayload as {
      pushName?: string
      key?: { fromMe?: boolean }
    } | null
    const pushName = payload?.pushName?.trim()
    const fromMe = payload?.key?.fromMe ?? false
    if (!pushName || isGenericDisplayName(pushName)) continue

    const data: { senderName?: string; sender?: string; chatName?: string } = {}
    if (!message.senderName?.trim()) {
      data.senderName = pushName
      data.sender = pushName
    }
    if (!message.chatName?.trim() && !message.chatId.endsWith('@g.us') && !fromMe) {
      data.chatName = pushName
    }
    if (Object.keys(data).length === 0) continue

    await prisma.whatsappMessage.update({ where: { id: message.id }, data })
    updated += 1
  }
  return updated
}

export async function backfillContentFromRawPayload(prisma: PrismaClient): Promise<number> {
  const { classifyBaileysContent } = await import('@finance-ai/core/domains/message-archive')
  const messages = await prisma.whatsappMessage.findMany({
    where: {
      OR: [
        { content: '' },
        { content: '—' },
        { messageType: 'UNKNOWN' },
      ],
    },
    select: { id: true, content: true, messageType: true, rawPayload: true },
    take: 3000,
  })

  let updated = 0
  for (const message of messages) {
    const raw = message.rawPayload as { message?: unknown } | null
    if (!raw?.message) continue
    try {
      const classified = classifyBaileysContent({ message: raw.message as never })
      if (!classified.content.trim()) continue
      if (
        message.content.trim() &&
        message.content.trim() !== '—' &&
        !message.content.startsWith('[unclassified:')
      ) {
        continue
      }
      await prisma.whatsappMessage.update({
        where: { id: message.id },
        data: {
          content: classified.content,
          messageType: classified.messageType,
        },
      })
      updated += 1
    } catch {
      // skip malformed payload
    }
  }
  return updated
}

function normalizeJid(jid: string): string {
  return jid.trim().split(':')[0] ?? jid.trim()
}

/** RC-06F — fix DM chatName polluted by outbound pushName (own display name). */
export async function repairDmChatNames(
  prisma: PrismaClient,
  ownJid: string | null | undefined,
): Promise<number> {
  const own = ownJid?.trim() ? normalizeJid(ownJid) : null
  const dmChats = await prisma.whatsappMessage.findMany({
    where: { NOT: { chatId: { endsWith: '@g.us' } } },
    distinct: ['chatId'],
    select: { chatId: true },
  })

  let updated = 0
  for (const { chatId } of dmChats) {
    if (own && normalizeJid(chatId) === own) continue

    const incoming = await prisma.whatsappMessage.findFirst({
      where: {
        chatId,
        fromMe: false,
        OR: [{ senderName: { not: null } }, { chatName: { not: null } }],
      },
      orderBy: { receivedAt: 'desc' },
      select: { senderName: true, chatName: true },
    })

    const correctName = incoming?.senderName?.trim() || incoming?.chatName?.trim()
    if (!correctName || isGenericDisplayName(correctName)) continue

    const wrongCount = await prisma.whatsappMessage.count({
      where: {
        chatId,
        OR: [{ chatName: null }, { chatName: '' }, { NOT: { chatName: correctName } }],
      },
    })
    if (wrongCount === 0) continue

    const result = await prisma.whatsappMessage.updateMany({
      where: { chatId },
      data: { chatName: correctName },
    })
    updated += result.count
  }

  return updated
}
