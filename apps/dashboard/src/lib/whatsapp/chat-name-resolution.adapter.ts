import type { PrismaClient } from '@finance-ai/database'
import { isGenericDisplayName } from '@finance-ai/shared/utils'
import type { ChatNameResolverPort } from '@finance-ai/core/domains/whatsapp-chat-config'
import type { ContactNameResolver } from '@finance-ai/whatsapp'

export function createChatNameResolverPort(
  prisma: PrismaClient,
  resolver: ContactNameResolver,
): ChatNameResolverPort {
  return {
    async resolve(chatId: string) {
      const trimmed = chatId.trim()

      if (trimmed.endsWith('@g.us')) {
        return { chatId: trimmed, ...(await resolver.fetchGroupMetadataSync(trimmed, 10_000)) }
      }

      if (trimmed.endsWith('@s.whatsapp.net')) {
        const contact = resolver.resolveContactName(trimmed)
        if (contact.name) return { chatId: trimmed, ...contact }
      }

      const configName = resolver.getBestName(trimmed)
      if (configName && !isGenericDisplayName(configName)) {
        return { chatId: trimmed, name: configName, source: 'resolver-cache' }
      }

      const pushName = await getMostFrequentPushName(prisma, trimmed)
      if (pushName) {
        return { chatId: trimmed, name: pushName, source: 'pushName-db' }
      }

      if (trimmed.endsWith('@lid')) {
        const incoming = await prisma.whatsappMessage.findFirst({
          where: { chatId: trimmed, fromMe: false, senderName: { not: null } },
          orderBy: { receivedAt: 'desc' },
          select: { senderName: true },
        })
        const senderName = incoming?.senderName?.trim()
        if (senderName && !isGenericDisplayName(senderName)) {
          return { chatId: trimmed, name: senderName, source: 'incoming-sender' }
        }
      }

      const contact = resolver.resolveContactName(trimmed)
      return { chatId: trimmed, ...contact }
    },
  }
}

async function getMostFrequentPushName(
  prisma: PrismaClient,
  chatId: string,
): Promise<string | null> {
  const messages = await prisma.whatsappMessage.findMany({
    where: { chatId },
    select: { rawPayload: true, senderName: true },
    orderBy: { receivedAt: 'desc' },
    take: 200,
  })

  const counts = new Map<string, number>()
  for (const message of messages) {
    const payload = message.rawPayload as { pushName?: string } | null
    const pushName = payload?.pushName?.trim() || message.senderName?.trim()
    if (!pushName || isGenericDisplayName(pushName)) continue
    counts.set(pushName, (counts.get(pushName) ?? 0) + 1)
  }

  let best: string | null = null
  let bestCount = 0
  for (const [name, count] of counts.entries()) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }
  return best
}
