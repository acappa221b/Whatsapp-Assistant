'use client'

import { useCallback, useEffect, useState } from 'react'

type WhatsappStatusPayload = {
  status: string
  connected?: boolean
  qrCode: string | null
  qrCodeDataUrl: string | null
  lastConnectedAt: string | null
  messageCount: number
  liveMessageCount?: number
  chatCount?: number
  lastMessageAt?: string | null
  lastEventName?: string | null
  lastEventAt?: string | null
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
const LIVE_MESSAGE_WARNING_MS = 60_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
      chatCount: incoming.chatCount ?? current.chatCount,
    }
  }

  if (incoming.status === 'disconnected' && !incoming.qrCodeDataUrl) {
    return {
      ...incoming,
      messageCount: incoming.messageCount ?? current.messageCount,
      liveMessageCount: incoming.liveMessageCount ?? current.liveMessageCount,
      chatCount: incoming.chatCount ?? current.chatCount,
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
    chatCount: incoming.chatCount ?? current.chatCount,
  }
}

async function fetchWhatsappStatus(): Promise<WhatsappStatusPayload> {
  const response = await fetch('/api/whatsapp/status')
  if (!response.ok) {
    throw new Error(`status ${response.status}`)
  }
  return response.json() as Promise<WhatsappStatusPayload>
}

export function WhatsappConnectionPanel() {
  const [status, setStatus] = useState<WhatsappStatusPayload>(DISCONNECTED_FALLBACK)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [showLiveWarning, setShowLiveWarning] = useState(false)

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

  useEffect(() => {
    if (status.status !== 'connected') {
      setShowLiveWarning(false)
      return
    }

    if ((status.liveMessageCount ?? 0) > 0) {
      setShowLiveWarning(false)
      return
    }

    const timer = window.setTimeout(() => {
      setShowLiveWarning(true)
    }, LIVE_MESSAGE_WARNING_MS)

    return () => window.clearTimeout(timer)
  }, [status.status, status.liveMessageCount])

  async function pollUntilQrResolved(): Promise<void> {
    const deadline = Date.now() + CONNECT_POLL_TIMEOUT_MS

    while (Date.now() < deadline) {
      try {
        const data = await fetchWhatsappStatus()
        applyStatus(data)

        if (data.qrCodeDataUrl || data.status === 'qr') return
        if (data.status === 'connected') return
      } catch {
        // SSE ou proximo ciclo pode entregar o QR
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
  const isConnected = status.status === 'connected'

  return (
    <div className="space-y-4">
      {isConnected && showLiveWarning && (status.liveMessageCount ?? 0) === 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Conectado, mas nenhuma mensagem nova foi recebida ainda. Envie uma mensagem de teste do
          celular AGORA. Este app nao importa historico antigo por padrao.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-medium">Status</h2>
          <p>
            <span className="text-muted-foreground">Estado:</span> <strong>{statusLabel}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Ultima conexao:</span>{' '}
            {status.lastConnectedAt
              ? new Date(status.lastConnectedAt).toLocaleString('pt-BR')
              : '-'}
          </p>
          <p>
            <span className="text-muted-foreground">Mensagens nesta sessao (live):</span>{' '}
            {status.liveMessageCount ?? 0}
          </p>
          <p>
            <span className="text-muted-foreground">Mensagens no banco:</span> {status.messageCount}
          </p>
          <p>
            <span className="text-muted-foreground">Chats descobertos:</span> {status.chatCount ?? 0}
          </p>
          <p>
            <span className="text-muted-foreground">Ultima mensagem:</span>{' '}
            {status.lastMessageAt
              ? new Date(status.lastMessageAt).toLocaleString('pt-BR')
              : '-'}
          </p>
          <p>
            <span className="text-muted-foreground">Ultimo evento:</span>{' '}
            {status.lastEventName ?? '-'}
            {status.lastEventAt
              ? ` (${new Date(status.lastEventAt).toLocaleString('pt-BR')})`
              : ''}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
              disabled={connecting}
              onClick={() => void connect()}
            >
              Conectar
            </button>
            <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => void disconnect()}>
              Desconectar
            </button>
            <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => void resetSession()}>
              Nova sessao (QR)
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
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
