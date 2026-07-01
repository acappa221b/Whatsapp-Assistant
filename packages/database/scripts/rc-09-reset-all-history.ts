#!/usr/bin/env tsx
import { resolve } from 'node:path'
import { config, REPO_ROOT } from '@finance-ai/shared/config'
import {
  clearWhatsappMediaStorage,
  countMediaFilesRecursive,
  deleteWhatsappDataInTransaction,
  prisma,
} from '@finance-ai/database'

type Options = {
  confirm: boolean
  keepNames: boolean
}

function parseArgs(argv: string[]): Options {
  return {
    confirm: argv.includes('--confirm') || process.env.RC09_RESET_CONFIRM === 'yes',
    keepNames: argv.includes('--keep-names'),
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const mediaRoot = resolve(REPO_ROOT, config.storage.mediaPath)

  const messageCount = await prisma.whatsappMessage.count()
  const mediaFiles = await countMediaFilesRecursive(mediaRoot)

  console.info('[RC-09/reset-all-history]', {
    mode: options.confirm ? 'confirm' : 'dry-run',
    messageCount,
    mediaFiles,
    keepNames: options.keepNames,
    mediaRoot,
  })

  if (!options.confirm) {
    console.info('Dry-run only. Re-run with --confirm or RC09_RESET_CONFIRM=yes to execute.')
    return
  }

  const deleted = await deleteWhatsappDataInTransaction(prisma)
  if (options.keepNames) {
    console.info('[RC-09/reset-all-history] keep-names flag ignored — RC-30 deletes all chat configs')
  }
  const mediaFilesRemoved = await clearWhatsappMediaStorage(mediaRoot)

  console.info('[RC-09/reset-all-history] done', {
    deletedMessages: deleted.deletedMessages,
    deletedChats: deleted.deletedChats,
    mediaFilesRemoved,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
