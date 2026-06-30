#!/usr/bin/env node
/** Prints the absolute path of the local Node executable. */
import { ensureLocalNode } from './ensure-node.mjs'

try {
  const executable = await ensureLocalNode()
  process.stdout.write(executable)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
}
