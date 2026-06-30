import { PrismaClient } from '@prisma/client'
import { getConfig } from '@finance-ai/shared/config'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
const databaseUrl = getConfig().database.url

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: getConfig().app.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  })

if (getConfig().app.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma
}

export type { PrismaClient }
