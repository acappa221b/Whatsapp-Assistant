#!/usr/bin/env tsx
/**
 * RC-05 diagnostic — validates DB counts, runtime health, and HTTP endpoints.
 * Usage: pnpm rc:05:diagnostic
 * Optional: BASE_URL=http://localhost:4000
 */
import { createConfig } from '@finance-ai/shared/config'
import { WhatsappMessagePrismaRepository } from '@finance-ai/database'
import {
  ListWhatsappChatArchiveUseCase,
  ListWhatsappMessagesUseCase,
} from '@finance-ai/core/domains/whatsapp-message'
import {
  checkRuntimeIntegrity,
  WHATSAPP_RUNTIME_VERSION,
} from '../apps/dashboard/src/lib/whatsapp/runtime-integrity.ts'
import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000'
const config = createConfig({
  DATABASE_URL: 'file:./packages/database/prisma/dev.db',
  OPENAI_API_KEY: 'diagnostic-placeholder',
})
const prisma = new PrismaClient({ datasources: { db: { url: config.database.url } } })

type Check = { name: string; pass: boolean; detail: string }

const checks: Check[] = []

function record(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name} — ${detail}`)
}

async function main() {
  console.log('RC-05 Diagnostic')
  console.log('DATABASE_URL:', config.database.url)
  console.log('BASE_URL:', BASE_URL)
  console.log('RUNTIME_VERSION:', WHATSAPP_RUNTIME_VERSION)
  console.log('---')

  const totalMessages = await prisma.whatsappMessage.count()
  const distinctRows = await prisma.$queryRaw<Array<{ cnt: bigint }>>`
    SELECT COUNT(DISTINCT chatId) AS cnt FROM WhatsappMessage
  `
  const distinctChats = Number(distinctRows[0]?.cnt ?? 0)

  record('db.totalMessages', totalMessages > 0, `count=${totalMessages}`)
  record('db.distinctChats', distinctChats > 0, `count=${distinctChats}`)

  const repo = new WhatsappMessagePrismaRepository(prisma)
  const archiveUseCase = new ListWhatsappChatArchiveUseCase(repo)
  const listUseCase = new ListWhatsappMessagesUseCase(repo)

  const chats = await archiveUseCase.execute()
  record('useCase.archiveChats', chats.length > 0, `items=${chats.length}`)

  const sampleChatId = chats[0]?.chatId
  if (sampleChatId) {
    const filtered = await listUseCase.execute({ chatId: sampleChatId }, { page: 1, limit: 500 })
    const allMatch = filtered.items.every((m) => m.chatId === sampleChatId)
    record(
      'useCase.chatIdFilter',
      allMatch && filtered.total <= totalMessages && filtered.total > 0,
      `chatId=${sampleChatId} total=${filtered.total} global=${totalMessages}`,
    )
  } else {
    record('useCase.chatIdFilter', false, 'no sample chatId')
  }

  const mockStale = { listUseCase: {}, storeUseCase: {} }
  const staleHealth = checkRuntimeIntegrity(mockStale)
  record(
    'runtime.integrityDetectsStale',
    !staleHealth.valid && staleHealth.missing.includes('listChatArchiveUseCase'),
    `missing=${staleHealth.missing.join(',')}`,
  )

  try {
    const archiveRes = await fetch(`${BASE_URL}/api/whatsapp/archive/chats`)
    const archiveBody = (await archiveRes.json()) as { items?: unknown[]; error?: string }
    record(
      'http.archiveChats',
      archiveRes.ok && Array.isArray(archiveBody.items),
      `status=${archiveRes.status} items=${archiveBody.items?.length ?? 0}${archiveBody.error ? ` error=${archiveBody.error}` : ''}`,
    )
  } catch (error) {
    record('http.archiveChats', false, error instanceof Error ? error.message : String(error))
  }

  try {
    const messagesRes = await fetch(`${BASE_URL}/api/whatsapp/messages?limit=5`)
    const messagesBody = (await messagesRes.json()) as { total?: number }
    record(
      'http.messages',
      messagesRes.ok && typeof messagesBody.total === 'number',
      `status=${messagesRes.status} total=${messagesBody.total}`,
    )
  } catch (error) {
    record('http.messages', false, error instanceof Error ? error.message : String(error))
  }

  if (sampleChatId) {
    try {
      const filteredRes = await fetch(
        `${BASE_URL}/api/whatsapp/messages?chatId=${encodeURIComponent(sampleChatId)}&limit=500`,
      )
      const filteredBody = (await filteredRes.json()) as { total?: number; items?: Array<{ chatId: string }> }
      const ok =
        filteredRes.ok &&
        typeof filteredBody.total === 'number' &&
        filteredBody.total < totalMessages &&
        (filteredBody.items ?? []).every((m) => m.chatId === sampleChatId)
      record(
        'http.messagesChatFilter',
        ok,
        `status=${filteredRes.status} filteredTotal=${filteredBody.total} global=${totalMessages}`,
      )
    } catch (error) {
      record('http.messagesChatFilter', false, error instanceof Error ? error.message : String(error))
    }
  }

  console.log('---')
  const failed = checks.filter((c) => !c.pass).length
  if (failed > 0) {
    console.log(`RESULT: FAIL (${failed}/${checks.length} checks failed)`)
    process.exitCode = 1
  } else {
    console.log(`RESULT: PASS (${checks.length}/${checks.length} checks)`)
  }
}

main()
  .catch((error) => {
    console.error('RC-05 diagnostic crashed', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
