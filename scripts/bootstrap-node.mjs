#!/usr/bin/env node
/** Uses global Node to prepare tools/node/ and print the executable path. */
import { ensureLocalNode } from './ensure-node.mjs'

try {
  const executable = await ensureLocalNode()
  console.log(executable)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
