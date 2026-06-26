/**
 * RC-02: executa tentativa real de conexão e imprime sequência de status.
 * Uso: npx tsx scripts/rc-02-baileys-connect-attempt.ts
 */

const BASE = process.env.DASHBOARD_URL ?? 'http://localhost:4000'

async function readJson(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, init)
  const body = await response.json()
  return { status: response.status, body }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('RC-02 Baileys connection attempt')
  console.log(`base: ${BASE}`)
  console.log(`startedAt: ${new Date().toISOString()}`)

  const initial = await readJson('/api/whatsapp/status')
  console.log('\n[initial status]', JSON.stringify(initial, null, 2))

  await readJson('/api/whatsapp/disconnect', { method: 'POST' })
  console.log('\n[disconnect] ok')

  const connect = await readJson('/api/whatsapp/connect', { method: 'POST' })
  console.log('\n[connect response]', JSON.stringify(connect, null, 2))

  const timeline: Array<{ at: string; status: unknown }> = []
  for (let i = 0; i < 15; i++) {
    await sleep(2000)
    const current = await readJson('/api/whatsapp/status')
    const snapshot = {
      at: new Date().toISOString(),
      httpStatus: current.status,
      status: current.body.status,
      qrCodePresent: Boolean(current.body.qrCode),
      qrCodeDataUrlPresent: Boolean(current.body.qrCodeDataUrl),
      lastConnectedAt: current.body.lastConnectedAt,
    }
    timeline.push({ at: snapshot.at, status: snapshot })
    console.log(`[poll ${i + 1}]`, JSON.stringify(snapshot))
    if (current.body.status === 'connected') break
  }

  console.log('\n[timeline summary]', JSON.stringify(timeline, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
