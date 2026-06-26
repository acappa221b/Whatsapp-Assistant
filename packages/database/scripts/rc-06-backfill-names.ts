/**
 * RC-06 — Backfill chatName/senderName from WhatsappChatConfig into historical messages.
 * Run manually: pnpm rc:06:backfill-names
 */
import { PrismaClient } from '@prisma/client'
import { resolveChatDisplayName } from '@finance-ai/shared/utils'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const configs = await prisma.whatsappChatConfig.findMany()
  let chatUpdated = 0
  let configUsed = 0

  for (const config of configs) {
    if (!config.name?.trim()) continue
    configUsed += 1
    const displayName = resolveChatDisplayName(config.chatId, config.name)
    if (displayName === 'Grupo' || displayName === 'Conversa') continue
    const result = await prisma.whatsappMessage.updateMany({
      where: {
        chatId: config.chatId,
        OR: [{ chatName: null }, { chatName: '' }],
      },
      data: { chatName: displayName },
    })
    chatUpdated += result.count
  }

  const pushNames = await prisma.whatsappMessage.findMany({
    where: { senderName: { not: null } },
    distinct: ['senderId'],
    select: { senderId: true, senderName: true },
  })

  let senderUpdated = 0
  for (const row of pushNames) {
    if (!row.senderName?.trim() || !row.senderId) continue
    const result = await prisma.whatsappMessage.updateMany({
      where: {
        senderId: row.senderId,
        OR: [{ senderName: null }, { senderName: '' }],
      },
      data: { senderName: row.senderName, sender: row.senderName },
    })
    senderUpdated += result.count
  }

  console.info('[RC-06/backfill]', {
    configsWithName: configUsed,
    messagesChatNameUpdated: chatUpdated,
    messagesSenderNameUpdated: senderUpdated,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
