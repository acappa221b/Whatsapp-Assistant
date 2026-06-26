import { PrismaClient } from '@prisma/client'
import { createConfig, createProcessEnv } from '@finance-ai/shared/config'

const config = createConfig(createProcessEnv({ DATABASE_URL: 'file:./packages/database/prisma/dev.db' }))
const prisma = new PrismaClient({ datasources: { db: { url: config.database.url } } })

async function main() {
  const total = await prisma.whatsappMessage.count()
  const distinctRows = await prisma.$queryRaw`SELECT COUNT(DISTINCT chatId) AS cnt FROM WhatsappMessage`
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
    select: {
      id: true,
      chatId: true,
      sender: true,
      senderId: true,
      senderName: true,
      chatName: true,
      messageType: true,
      content: true,
      fromMe: true,
      receivedAt: true,
    },
  })

  const emptyText = await prisma.whatsappMessage.count({
    where: { messageType: 'TEXT', OR: [{ content: '' }, { content: '—' }] },
  })

  console.log(JSON.stringify({
    databaseUrl: config.database.url,
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
    latestMessageSample: sample,
  }, null, 2))

  try {
    const groups = await prisma.whatsappMessage.groupBy({
      by: ['chatId'],
      _count: { _all: true },
      _max: { receivedAt: true },
    })
    console.log('\nlistChatSummaries groupBy OK, groups=' + groups.length)
  } catch (e) {
    console.error('\nlistChatSummaries groupBy FAILED:', e)
  }
}

main()
  .catch((e) => {
    console.error('DIAGNOSTIC_ERROR', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
