import { readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PrismaClient } from './client'

export type WhatsappDataDeleteCounts = {
  deletedMessages: number
  deletedChats: number
  deletedReports: number
  deletedAssistantConversations: number
  deletedAssistantActionLogs: number
  deletedExtractions: number
  deletedApprovalQueue: number
}

export async function countMediaFilesRecursive(dir: string): Promise<number> {
  let count = 0
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) count += await countMediaFilesRecursive(full)
      else if (entry.isFile() && entry.name !== '.gitkeep') count += 1
    }
  } catch {
    return 0
  }
  return count
}

export async function clearWhatsappMediaStorage(mediaRoot: string): Promise<number> {
  const mediaFiles = await countMediaFilesRecursive(mediaRoot)
  try {
    const entries = await readdir(mediaRoot)
    for (const entry of entries) {
      if (entry === '.gitkeep') continue
      await rm(join(mediaRoot, entry), { recursive: true, force: true })
    }
  } catch {
    // media root may not exist
  }
  await writeFile(join(mediaRoot, '.gitkeep'), '', { flag: 'w' })
  return mediaFiles
}

export async function deleteWhatsappDataInTransaction(
  prisma: PrismaClient,
): Promise<WhatsappDataDeleteCounts> {
  return prisma.$transaction(async (tx) => {
    const deletedExtractions = await tx.extraction.deleteMany()
    const deletedMessages = await tx.whatsappMessage.deleteMany()
    const deletedChats = await tx.whatsappChatConfig.deleteMany()
    const deletedReports = await tx.conversationDailyReport.deleteMany()
    const deletedAssistantConversations = await tx.assistantConversation.deleteMany()
    const deletedAssistantActionLogs = await tx.assistantActionLog.deleteMany()
    const deletedApprovalQueue = await tx.approvalQueue.deleteMany()

    return {
      deletedMessages: deletedMessages.count,
      deletedChats: deletedChats.count,
      deletedReports: deletedReports.count,
      deletedAssistantConversations: deletedAssistantConversations.count,
      deletedAssistantActionLogs: deletedAssistantActionLogs.count,
      deletedExtractions: deletedExtractions.count,
      deletedApprovalQueue: deletedApprovalQueue.count,
    }
  })
}
