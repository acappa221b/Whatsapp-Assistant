import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc14bBootstrapHarness: Harness = {
  name: 'Rc14bBootstrapHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'scripts/ensure-node.mjs',
      'scripts/ensure-node-path.mjs',
      'scripts/bootstrap-node.mjs',
      'scripts/bootstrap-node.ps1',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const bat = readFileSync(join(ROOT, 'Start WhatsApp Assistant.bat'), 'utf-8')
    if (!bat.includes('bootstrap-node.ps1')) {
      errors.push('.bat must fallback to bootstrap-node.ps1 when Node is absent')
    }
    if (!bat.includes('ensure-node-path.mjs')) {
      errors.push('.bat must use ensure-node-path.mjs for portable Node')
    }

    const ensure = readFileSync(join(ROOT, 'scripts/ensure-node.mjs'), 'utf-8')
    if (!ensure.includes('getLocalNodeExecutable') || !ensure.includes('ensureLocalNode')) {
      errors.push('ensure-node.mjs must export getLocalNodeExecutable and ensureLocalNode')
    }
    if (!ensure.includes('tools/node')) {
      errors.push('ensure-node.mjs must install to tools/node/')
    }

    const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8')
    if (!gitignore.includes('tools/node/')) {
      errors.push('.gitignore must ignore tools/node/')
    }

    return createResult(this.name, errors)
  },
}

export const Rc14bHarnesses = [Rc14bBootstrapHarness]
