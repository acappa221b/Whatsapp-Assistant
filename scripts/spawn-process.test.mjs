import assert from 'node:assert/strict'
import { isWindowsCmdScript } from './spawn-process.mjs'

assert.equal(isWindowsCmdScript('C:\\tools\\pnpm.cmd'), true)
assert.equal(isWindowsCmdScript('run.bat'), true)
assert.equal(isWindowsCmdScript('node.exe'), false)

console.log('spawn-process tests passed')
