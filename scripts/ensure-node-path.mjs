#!/usr/bin/env node
/** Imprime no stdout o caminho absoluto do Node local (garante download se necessário). */
import { ensureLocalNode } from './ensure-node.mjs'

try {
  const executable = await ensureLocalNode()
  process.stdout.write(executable)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
}
