import { prisma, WhatsappMessagePrismaRepository } from '../src/index'
import { ListWhatsappChatArchiveUseCase } from '@finance-ai/core/domains/whatsapp-message'

async function main() {
  const repo = new WhatsappMessagePrismaRepository(prisma)
  const useCase = new ListWhatsappChatArchiveUseCase(repo)
  try {
    const chats = await useCase.execute()
    console.log('SUCCESS count=' + chats.length)
    console.log(JSON.stringify(chats.slice(0, 5), null, 2))
  } catch (e) {
    console.error('FAILED', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

void main()
