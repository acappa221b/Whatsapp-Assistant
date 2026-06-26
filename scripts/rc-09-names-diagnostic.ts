#!/usr/bin/env tsx
import { prisma } from '@finance-ai/database'
import { isGenericDisplayName } from '@finance-ai/shared/utils'

async function main() {
  const configs = await prisma.whatsappChatConfig.findMany({
    select: { chatId: true, name: true },
    orderBy: { updatedAt: 'desc' },
  })

  console.info('=== WhatsappChatConfig names ===')
  for (const config of configs) {
    const generic = !config.name || isGenericDisplayName(config.name)
    console.log(`${generic ? '⚠️' : '✅'} ${config.chatId} → ${config.name ?? '(null)'}`)
  }

  const byType = await prisma.$queryRaw<
    Array<{ tipo: string; total: bigint; sem_nome: bigint }>
  >`
    SELECT
      CASE
        WHEN chatId LIKE '%@g.us' THEN 'group'
        WHEN chatId LIKE '%@lid' THEN 'lid'
        WHEN chatId LIKE '%@s.whatsapp.net' THEN 'dm'
        ELSE 'other'
      END AS tipo,
      COUNT(*) AS total,
      SUM(CASE WHEN name IS NULL OR name = '' THEN 1 ELSE 0 END) AS sem_nome
    FROM WhatsappChatConfig
    GROUP BY tipo
  `

  console.info('\n=== Distribution by JID type ===')
  console.table(
    byType.map((row) => ({
      tipo: row.tipo,
      total: Number(row.total),
      sem_nome: Number(row.sem_nome),
    })),
  )

  const lidSamples = await prisma.$queryRaw<
    Array<{ chatId: string; pushName: string | null }>
  >`
    SELECT chatId, json_extract(rawPayload, '$.pushName') AS pushName
    FROM WhatsappMessage
    WHERE chatId LIKE '%@lid'
    LIMIT 20
  `

  console.info('\n=== @lid pushName samples ===')
  console.table(lidSamples)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
