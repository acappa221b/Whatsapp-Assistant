const BASE = process.env.RC02_API_BASE ?? 'http://localhost:4000'

async function fetchJson(path: string) {
  const response = await fetch(`${BASE}${path}`)
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : { raw: await response.text() }
  return { path, status: response.status, ok: response.ok, body }
}

async function main() {
  const results = await Promise.all([
    fetchJson('/api/whatsapp/status'),
    fetchJson('/api/whatsapp/messages?limit=5'),
    fetchJson('/api/whatsapp/chats'),
    fetchJson('/api/whatsapp/groups'),
  ])

  console.log(
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        base: BASE,
        results: results.map((result) => ({
          path: result.path,
          status: result.status,
          ok: result.ok,
          recordCount:
            result.body && typeof result.body === 'object' && 'items' in result.body
              ? Array.isArray((result.body as { items: unknown[] }).items)
                ? (result.body as { items: unknown[] }).items.length
                : null
              : null,
          total:
            result.body && typeof result.body === 'object' && 'total' in result.body
              ? (result.body as { total: number }).total
              : null,
          body: result.body,
        })),
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
