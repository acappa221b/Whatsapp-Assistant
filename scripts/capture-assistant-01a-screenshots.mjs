import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs/releases/screenshots')

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

for (const [path, name] of [
  ['/dashboard', 'assistant-01a-dashboard.png'],
  ['/dashboard/reports', 'assistant-01a-reports.png'],
  ['/dashboard/whatsapp', 'assistant-01a-whatsapp.png'],
]) {
  await page.goto(`http://localhost:4000${path}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: join(outDir, name), fullPage: true })
  console.log(`Saved ${name}`)
}

await browser.close()
