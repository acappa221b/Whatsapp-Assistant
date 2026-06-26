/**
 * RC-07 — Names diagnostic
 * Usage: pnpm rc:07:names-diagnostic
 */
import { PrismaClient } from '@prisma/client'
import { createConfig } from '@finance-ai/shared/config'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  createConfig({
    DATABASE_URL: process.env.DATABASE_URL ?? 'file:./packages/database/prisma/dev.db',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  })

  const [
    totalMessages,
    missingChatName,
    missingSenderName,
    configsWithName,
    sample,
  ] = await Promise.all([
    prisma.whatsappMessage.count(),
    prisma.whatsappMessage.count({
      where: { OR: [{ chatName: null }, { chatName: '' }] },
    }),
    prisma.whatsappMessage.count({
      where: { OR: [{ senderName: null }, { senderName: '' }] },
    }),
    prisma.whatsappChatConfig.count({ where: { name: { not: null } } }),
    prisma.whatsappMessage.findMany({
      take: 5,
      orderBy: { receivedAt: 'desc' },
      select: {
        chatId: true,
        senderId: true,
        senderName: true,
        chatName: true,
        content: true,
        messageType: true,
        rawPayload: true,
      },
    }),
  ])

  console.log('RC-07 Names Diagnostic')
  console.log('---')
  console.log(`totalMessages: ${totalMessages}`)
  console.log(`missingChatName: ${missingChatName}`)
  console.log(`missingSenderName: ${missingSenderName}`)
  console.log(`configsWithName: ${configsWithName}`)
  console.log('sample (latest 5):')
  for (const row of sample) {
    const payload = row.rawPayload as { pushName?: string } | null
    console.log({
      chatId: row.chatId,
      chatName: row.chatName,
      senderName: row.senderName,
      pushNameInRaw: payload?.pushName ?? null,
      contentLen: row.content?.length ?? 0,
      type: row.messageType,
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
