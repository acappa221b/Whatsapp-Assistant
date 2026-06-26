import { createConfig, createProcessEnv } from '@finance-ai/shared/config'
import { prisma, WhatsappMessagePrismaRepository } from '@finance-ai/database'
import { ListWhatsappChatArchiveUseCase } from '@finance-ai/core/domains/whatsapp-message'

const config = createConfig(createProcessEnv({ DATABASE_URL: 'file:./packages/database/prisma/dev.db' }))
console.log('DB URL:', config.database.url)

const repo = new WhatsappMessagePrismaRepository(prisma)
const useCase = new ListWhatsappChatArchiveUseCase(repo)

try {
  const chats = await useCase.execute()
  console.log('listChatArchive SUCCESS, count=', chats.length)
  console.log(JSON.stringify(chats.slice(0, 5), null, 2))
} catch (e) {
  console.error('listChatArchive FAILED:', e)
}

await prisma.$disconnect()
