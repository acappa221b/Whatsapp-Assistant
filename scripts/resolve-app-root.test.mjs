import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isUncPath, resolveAppRoot } from './resolve-app-root.mjs'

assert.equal(isUncPath('\\\\server\\share\\folder'), true)
assert.equal(isUncPath('C:\\local\\app'), false)
assert.equal(isUncPath('/mnt/share'), false)

const tempDir = mkdtempSync(join(tmpdir(), 'wa-root-'))
try {
  const previous = process.env.WA_APP_ROOT
  process.env.WA_APP_ROOT = tempDir
  writeFileSync(join(tempDir, 'package.json'), '{}')
  const resolved = resolveAppRoot(new URL('./resolve-app-root.mjs', import.meta.url).href)
  assert.equal(resolved, tempDir)
  process.env.WA_APP_ROOT = previous
  console.log('resolve-app-root tests passed')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
