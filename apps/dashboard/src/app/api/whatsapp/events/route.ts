import { ensureWhatsappReady, subscribeWhatsappStatus } from '@/lib/whatsapp/runtime'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await ensureWhatsappReady()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      const unsubscribe = subscribeWhatsappStatus((status) => {
        const payload = {
          status: status.status,
          qrCode: status.qrCode,
          qrCodeDataUrl: status.qrCodeDataUrl,
          lastConnectedAt: status.lastConnectedAt?.toISOString() ?? null,
          messageCount: status.messageCount,
          authenticated: status.authenticated,
        }
        console.info('[rc04/trace] api-sse :: push', {
          at: new Date().toISOString(),
          status: payload.status,
          qrCodeDataUrlLength: payload.qrCodeDataUrl?.length ?? 0,
          qrCodeDataUrlPresent: Boolean(payload.qrCodeDataUrl),
        })
        send(payload)
      })

      request.signal.addEventListener('abort', () => {
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
