import { PrismaClient } from '@prisma/client'
import { getConfig } from '@finance-ai/shared/config'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
const databaseUrl = getConfig().database.url

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: getConfig().app.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/did not initialize yet/i.test(message)) {
      console.error(
        '[database] Prisma Client não gerado. Execute Start WhatsApp Assistant.bat ou: pnpm db:migrate && pnpm db:generate',
      )
    }
    throw error
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (getConfig().app.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma
}

export type { PrismaClient }
