/**
 * RC-04: rastreia fluxo QR via API (sem browser).
 */
const BASE = process.env.DASHBOARD_URL ?? 'http://localhost:4000'

type TimelineEntry = { at: string; event: string; data: unknown }

const timeline: TimelineEntry[] = []

function record(event: string, data: unknown) {
  const entry = { at: new Date().toISOString(), event, data }
  timeline.push(entry)
  console.log(JSON.stringify(entry))
}

async function readJson(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, init)
  const body = await response.json()
  return { status: response.status, ok: response.ok, body }
}

async function consumeSse(seconds: number) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), seconds * 1000)

  const response = await fetch(`${BASE}/api/whatsapp/events`, { signal: controller.signal })
  if (!response.ok || !response.body) {
    record('sse-open-failed', { status: response.status })
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''
      for (const part of parts) {
        const line = part.split('\n').find((l) => l.startsWith('data: '))
        if (!line) continue
        const payload = JSON.parse(line.slice(6)) as Record<string, unknown>
        record('sse-event', {
          status: payload.status,
          qrCodeDataUrlPresent: Boolean(payload.qrCodeDataUrl),
          qrCodeDataUrlLength:
            typeof payload.qrCodeDataUrl === 'string' ? payload.qrCodeDataUrl.length : 0,
        })
      }
    }
  } catch (error) {
    if (controller.signal.aborted) {
      record('sse-closed', { reason: 'timeout' })
    } else {
      record('sse-error', { message: String(error) })
    }
  }
}

async function main() {
  record('start', { base: BASE })

  const initial = await readJson('/api/whatsapp/status')
  record('GET /api/whatsapp/status (initial)', {
    httpStatus: initial.status,
    status: initial.body.status,
    qrCodeDataUrlPresent: Boolean(initial.body.qrCodeDataUrl),
  })

  await readJson('/api/whatsapp/disconnect', { method: 'POST' })
  record('POST /api/whatsapp/disconnect', { ok: true })

  const ssePromise = consumeSse(12)

  const connect = await readJson('/api/whatsapp/connect', { method: 'POST' })
  record('POST /api/whatsapp/connect', {
    httpStatus: connect.status,
    status: connect.body.status,
    qrCodeDataUrlPresent: Boolean(connect.body.qrCodeDataUrl),
  })

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 500))
    const poll = await readJson('/api/whatsapp/status')
    record(`GET /api/whatsapp/status (poll ${i + 1})`, {
      httpStatus: poll.status,
      status: poll.body.status,
      qrCodeDataUrlPresent: Boolean(poll.body.qrCodeDataUrl),
      qrCodeDataUrlLength: poll.body.qrCodeDataUrl?.length ?? 0,
    })
    if (poll.body.status === 'qr' && poll.body.qrCodeDataUrl) break
  }

  await ssePromise
  record('timeline-complete', { entries: timeline.length })
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
