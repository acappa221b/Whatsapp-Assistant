#!/usr/bin/env tsx
import { readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { config, REPO_ROOT } from '@finance-ai/shared/config'
import { prisma } from '@finance-ai/database'

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

async function countFilesRecursive(dir: string): Promise<number> {
  let count = 0
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) count += await countFilesRecursive(full)
      else if (entry.isFile() && entry.name !== '.gitkeep') count += 1
    }
  } catch {
    return 0
  }
  return count
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const mediaRoot = resolve(REPO_ROOT, config.storage.mediaPath)

  const messageCount = await prisma.whatsappMessage.count()
  const mediaFiles = await countFilesRecursive(mediaRoot)

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

  const deletedMessages = await prisma.whatsappMessage.deleteMany()
  await prisma.whatsappChatConfig.updateMany({
    data: {
      archiveEnabled: false,
      aiProcessingEnabled: false,
      agentChatEnabled: false,
      storageDir: null,
      ...(options.keepNames ? {} : { name: null }),
    },
  })

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

  console.info('[RC-09/reset-all-history] done', {
    deletedMessages: deletedMessages.count,
    mediaFilesRemoved: mediaFiles,
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
