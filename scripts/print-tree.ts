#!/usr/bin/env node
/** Print project directory tree (Epic 01 validation helper) */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'coverage', 'test-results', 'playwright-report'])

function walk(dir: string, prefix = ''): string[] {
  const lines: string[] = []
  const entries = readdirSync(dir).filter((e) => !SKIP.has(e)).sort()
  entries.forEach((entry, i) => {
    const path = join(dir, entry)
    const last = i === entries.length - 1
    lines.push(`${prefix}${last ? '└── ' : '├── '}${entry}`)
    if (statSync(path).isDirectory()) {
      lines.push(...walk(path, prefix + (last ? '    ' : '│   ')))
    }
  })
  return lines
}

console.log('finance-ai/')
console.log(walk(ROOT).join('\n'))
