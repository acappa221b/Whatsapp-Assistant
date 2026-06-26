import type { PrismaClient } from '@finance-ai/database'
import { classifyBaileysContent } from '@finance-ai/core/domains/message-archive'
import { logRc07 } from '@finance-ai/shared/utils'
import {
  backfillContentFromRawPayload,
  backfillNamesFromRawPayload,
  repairDmChatNames,
} from './name-bootstrap'

export type RepairHistoricalMessagesResult = {
  contentRepaired: number
  namesRepaired: number
  chatsRenamed: number
  wrappersFound: Record<string, number>
}

function countWrappersInPayload(raw: { message?: unknown } | null): string[] {
  const wrappers: string[] = []
  let current = raw?.message as Record<string, unknown> | undefined
  const keys = [
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage',
    'editedMessage',
    'deviceSentMessage',
    'futureProofMessage',
    'albumMessage',
  ]
  for (let depth = 0; depth < 12 && current; depth += 1) {
    let found = false
    for (const key of keys) {
      const wrapper = current[key] as { message?: Record<string, unknown> } | undefined
      if (wrapper?.message) {
        wrappers.push(key)
        current = wrapper.message
        found = true
        break
      }
    }
    if (!found) break
  }
  return wrappers
}

/** RC-07 — rebuild historical rows from rawPayload without changing ids. */
export async function repairHistoricalMessages(input: {
  prisma: PrismaClient
  ownJid?: string | null
  sampleWrappers?: boolean
}): Promise<RepairHistoricalMessagesResult> {
  logRc07('BACKFILL', { event: 'repair_start' })

  const wrappersFound: Record<string, number> = {}
  if (input.sampleWrappers) {
    const sample = await input.prisma.whatsappMessage.findMany({
      select: { rawPayload: true },
      take: 500,
    })
    for (const row of sample) {
      for (const w of countWrappersInPayload(row.rawPayload as { message?: unknown })) {
        wrappersFound[w] = (wrappersFound[w] ?? 0) + 1
      }
    }
  }

  const [contentRepaired, namesRepaired, chatsRenamed] = await Promise.all([
    backfillContentFromRawPayload(input.prisma),
    backfillNamesFromRawPayload(input.prisma),
    repairDmChatNames(input.prisma, input.ownJid),
  ])

  logRc07('BACKFILL', {
    event: 'repair_complete',
    contentRepaired,
    namesRepaired,
    chatsRenamed,
    wrappersFound,
  })

  return { contentRepaired, namesRepaired, chatsRenamed, wrappersFound }
}

export { classifyBaileysContent }
