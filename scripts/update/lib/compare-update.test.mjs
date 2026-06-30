import assert from 'node:assert/strict'
import {
  compareVersions,
  isNewerVersion,
  isUpdateAvailable,
  parseVersion,
} from './compare-update.mjs'

assert.equal(isNewerVersion('1.5.3-rc21', '1.6.1-rc18b'), false)
assert.equal(isNewerVersion('1.6.2-rc24', '1.6.1-rc18b'), true)
assert.equal(compareVersions('1.6.1-rc18a', '1.6.1-rc18b'), -1)
assert.equal(parseVersion('1.6.1-rc18b')?.prerelease?.suffix, 'b')
assert.equal(isUpdateAvailable('1.6.1-rc18b', '1.5.3-rc21'), false)
assert.equal(isNewerVersion('1.0.0', 'totally-invalid'), false)

console.log('compare-update.mjs tests passed')
