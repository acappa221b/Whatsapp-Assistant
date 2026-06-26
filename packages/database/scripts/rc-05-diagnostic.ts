import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.whatsappMessage.count()
  const distinctRows = await prisma.$queryRaw<Array<{ cnt: bigint }>>`
    SELECT COUNT(DISTINCT chatId) AS cnt FROM WhatsappMessage
  `
  const byType = await prisma.whatsappMessage.groupBy({
    by: ['messageType'],
    _count: { _all: true },
  })
  const chatGroups = await prisma.whatsappMessage.groupBy({
    by: ['chatId'],
    _count: { _all: true },
    _max: { receivedAt: true },
    orderBy: { _max: { receivedAt: 'desc' } },
    take: 10,
  })
  const chatConfigCount = await prisma.whatsappChatConfig.count()
  const sample = await prisma.whatsappMessage.findFirst({
    orderBy: { receivedAt: 'desc' },
  })
  const emptyText = await prisma.whatsappMessage.count({
    where: { messageType: 'TEXT', OR: [{ content: '' }, { content: '—' }] },
  })

  console.log(JSON.stringify({
    databaseUrl: process.env.DATABASE_URL,
    totalMessages: total,
    distinctChatIds: Number(distinctRows[0]?.cnt ?? 0),
    chatConfigRows: chatConfigCount,
    emptyTextMessages: emptyText,
    byMessageType: byType.map((r) => ({ type: r.messageType, count: r._count._all })),
    topChatsByActivity: chatGroups.map((g) => ({
      chatId: g.chatId,
      messageCount: g._count._all,
      lastMessageAt: g._max.receivedAt,
    })),
    latestMessageSample: sample
      ? {
          id: sample.id,
          chatId: sample.chatId,
          sender: sample.sender,
          senderId: sample.senderId,
          senderName: sample.senderName,
          chatName: sample.chatName,
          messageType: sample.messageType,
          content: sample.content?.slice(0, 80),
          fromMe: sample.fromMe,
          receivedAt: sample.receivedAt,
          hasRawPayload: sample.rawPayload != null,
        }
      : null,
  }, null, 2))
}

main()
  .catch((e) => {
    console.error('DIAGNOSTIC_ERROR', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
