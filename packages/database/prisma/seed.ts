import { PrismaClient } from '@prisma/client'

const DEFAULT_EXPENSE_CATEGORIES = [
  'Alimentação',
  'Combustível',
  'Marketing',
  'Ferramentas',
  'Impostos',
  'Transporte',
  'Outros',
] as const

async function main() {
  const prisma = new PrismaClient()

  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name, type: 'EXPENSE' } },
      create: { name, type: 'EXPENSE' },
      update: {},
    })
  }

  await prisma.$disconnect()
  console.log(`Seeded ${DEFAULT_EXPENSE_CATEGORIES.length} expense categories`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
