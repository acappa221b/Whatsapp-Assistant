#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { resolveAppRoot } from './resolve-app-root.mjs'

const ROOT = resolveAppRoot(import.meta.url)

try {
  execSync('pnpm db:generate', {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  })
} catch {
  console.warn(
    'WARN: db:generate skipped during postinstall — run Start WhatsApp Assistant.bat to generate Prisma Client.',
  )
}
