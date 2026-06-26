import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    'PRAGMA table_info(WhatsappMessage)',
  )
  const fromMe = columns.find((c) => c.name === 'fromMe')
  console.log('fromMe column:', fromMe ?? 'MISSING')
  console.log(
    'all columns:',
    columns.map((c) => c.name).join(', '),
  )

  // Smoke: query with fromMe filter (same as listChatSummaries)
  const row = await prisma.whatsappMessage.findFirst({
    where: { fromMe: false },
  })
  console.log('findFirst fromMe:false ok, row:', row?.id ?? null)
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
