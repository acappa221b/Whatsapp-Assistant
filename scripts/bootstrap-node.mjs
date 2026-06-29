#!/usr/bin/env node
/** Bootstrap via Node global — garante tools/node/ e imprime o caminho. */
import { ensureLocalNode } from './ensure-node.mjs'

try {
  const executable = await ensureLocalNode()
  console.log(executable)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
