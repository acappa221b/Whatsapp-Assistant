import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyOverlay } from './apply-overlay.mjs'

const tempRoot = mkdtempSync(join(tmpdir(), 'wa-overlay-'))
try {
  const source = join(tempRoot, 'source')
  const target = join(tempRoot, 'target')
  mkdirSync(join(source, 'apps/dashboard'), { recursive: true })
  mkdirSync(join(target, 'storage', 'whatsapp'), { recursive: true })
  mkdirSync(join(target, 'packages/database/prisma'), { recursive: true })

  writeFileSync(join(source, 'package.json'), '{"version":"1.6.1"}')
  writeFileSync(join(source, 'apps/dashboard/page.txt'), 'new-ui')
  writeFileSync(join(target, 'package.json'), '{"version":"1.6.0"}')
  writeFileSync(join(target, 'storage/whatsapp/session.json'), '{"keep":true}')
  writeFileSync(join(target, 'packages/database/prisma/dev.db'), 'sqlite-data')

  const result = applyOverlay(source, target, () => {})

  assert.equal(result.copied, 2)
  assert.equal(readFileSync(join(target, 'package.json'), 'utf-8'), '{"version":"1.6.1"}')
  assert.equal(readFileSync(join(target, 'storage/whatsapp/session.json'), 'utf-8'), '{"keep":true}')
  assert.ok(existsSync(join(target, 'packages/database/prisma/dev.db')))
  console.log('apply-overlay tests passed')
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
