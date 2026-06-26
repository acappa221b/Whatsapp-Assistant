'use client'

import { useCallback, useEffect, useState } from 'react'

type WhatsappStatusPayload = {
  status: string
  qrCode: string | null
  qrCodeDataUrl: string | null
  lastConnectedAt: string | null
  messageCount: number
  liveMessageCount?: number
}

const DISCONNECTED_FALLBACK: WhatsappStatusPayload = {
  status: 'disconnected',
  qrCode: null,
  qrCodeDataUrl: null,
  lastConnectedAt: null,
  messageCount: 0,
}

const NORMAL_POLL_MS = 10_000
const ACTIVE_POLL_MS = 2_000
const CONNECT_FAST_POLL_MS = 500
const CONNECT_POLL_TIMEOUT_MS = 15_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Preserva QR recebido se uma resposta tardia vier sem qrCodeDataUrl (ex.: race SSE vs GET). */
function mergeStatus(
  current: WhatsappStatusPayload,
  incoming: WhatsappStatusPayload,
): WhatsappStatusPayload {
  if (incoming.status === 'connected') {
    return {
      ...incoming,
      qrCode: null,
      qrCodeDataUrl: null,
      liveMessageCount: incoming.liveMessageCount ?? current.liveMessageCount,
    }
  }

  if (incoming.status === 'disconnected' && !incoming.qrCodeDataUrl) {
    return {
      ...incoming,
      messageCount: incoming.messageCount ?? current.messageCount,
      liveMessageCount: incoming.liveMessageCount ?? current.liveMessageCount,
    }
  }

  const qrCodeDataUrl = incoming.qrCodeDataUrl ?? current.qrCodeDataUrl
  const qrCode = incoming.qrCode ?? current.qrCode
  const status = qrCodeDataUrl ? 'qr' : incoming.status

  return {
    ...incoming,
    status,
    qrCode,
    qrCodeDataUrl,
    messageCount: incoming.messageCount ?? current.messageCount,
    liveMessageCount: incoming.liveMessageCount ?? current.liveMessageCount,
  }
}

async function fetchWhatsappStatus(): Promise<WhatsappStatusPayload> {
  const response = await fetch('/api/whatsapp/status')
  if (!response.ok) {
    throw new Error(`status ${response.status}`)
  }
  return response.json() as Promise<WhatsappStatusPayload>
}

export default function WhatsappConnectionPage() {
  const [status, setStatus] = useState<WhatsappStatusPayload>(DISCONNECTED_FALLBACK)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const applyStatus = useCallback((incoming: WhatsappStatusPayload) => {
    setStatus((current) => mergeStatus(current, incoming))
  }, [])

  useEffect(() => {
    void fetchWhatsappStatus()
      .then((data) => applyStatus(data))
      .catch(() => applyStatus(DISCONNECTED_FALLBACK))
      .finally(() => setIsBootstrapping(false))

    const source = new EventSource('/api/whatsapp/events')
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as WhatsappStatusPayload
      applyStatus(payload)
    }
    return () => source.close()
  }, [applyStatus])

  useEffect(() => {
    const pollMs =
      status.status === 'connecting' || status.status === 'qr' ? ACTIVE_POLL_MS : NORMAL_POLL_MS

    const interval = setInterval(() => {
      void fetchWhatsappStatus()
        .then((data) => applyStatus(data))
        .catch(() => undefined)
    }, pollMs)

    return () => clearInterval(interval)
  }, [status.status, applyStatus])

  async function pollUntilQrResolved(): Promise<void> {
    const deadline = Date.now() + CONNECT_POLL_TIMEOUT_MS

    while (Date.now() < deadline) {
      try {
        const data = await fetchWhatsappStatus()
        applyStatus(data)

        if (data.qrCodeDataUrl || data.status === 'qr') return
        if (data.status === 'connected') return
      } catch {
        // mantém polling até timeout; SSE ou próximo ciclo pode entregar o QR
      }

      await sleep(CONNECT_FAST_POLL_MS)
    }
  }

  async function connect() {
    setConnecting(true)
    try {
      await fetch('/api/whatsapp/connect', { method: 'POST' })
      await pollUntilQrResolved()
    } finally {
      setConnecting(false)
    }
  }

  async function resetSession() {
    setConnecting(true)
    try {
      await fetch('/api/whatsapp/reset-session', { method: 'POST' })
      await pollUntilQrResolved()
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    await fetch('/api/whatsapp/disconnect', { method: 'POST' })
    try {
      const data = await fetchWhatsappStatus()
      applyStatus(data)
    } catch {
      applyStatus(DISCONNECTED_FALLBACK)
    }
  }

  const statusLabel = isBootstrapping ? 'carregando...' : status.status

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conexão WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Status da sessão Baileys e QR Code para pareamento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-medium">Status</h2>
          <p>
            <span className="text-muted-foreground">Estado:</span>{' '}
            <strong>{statusLabel}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Última conexão:</span>{' '}
            {status.lastConnectedAt
              ? new Date(status.lastConnectedAt).toLocaleString('pt-BR')
              : '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Mensagens persistidas:</span>{' '}
            {status.messageCount}
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
              disabled={connecting}
              onClick={() => void connect()}
            >
              Conectar
            </button>
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              onClick={() => void disconnect()}
            >
              Desconectar
            </button>
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              onClick={() => void resetSession()}
            >
              Nova sessão (QR)
            </button>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-medium">QR Code</h2>
          {status.qrCodeDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={status.qrCodeDataUrl} alt="QR Code WhatsApp" className="mx-auto h-64 w-64" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {status.status === 'qr' || connecting
                ? 'Gerando QR Code...'
                : 'Nenhum QR Code ativo. Clique em Conectar para iniciar.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
