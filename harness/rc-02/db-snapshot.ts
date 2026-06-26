import { prisma } from '@finance-ai/database'

async function main() {
  const messages = await prisma.whatsappMessage.count()
  const chats = await prisma.whatsappChatConfig.count()
  const groups = await prisma.whatsappChatConfig.count({
    where: { chatId: { endsWith: '@g.us' } },
  })
  const recent = await prisma.whatsappMessage.findMany({
    take: 5,
    orderBy: { receivedAt: 'desc' },
    select: { id: true, chatId: true, content: true, receivedAt: true, externalMessageId: true },
  })
  const byChat = await prisma.whatsappMessage.groupBy({
    by: ['chatId'],
    _count: true,
    orderBy: { _count: { chatId: 'desc' } },
    take: 10,
  })
  const chatConfigs = await prisma.whatsappChatConfig.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
  })

  console.log(
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        counts: { messages, chats, groups },
        recentMessages: recent,
        messagesByChat: byChat,
        recentChatConfigs: chatConfigs,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
