'use client'

import { useCallback, useEffect, useState } from 'react'

export type WhatsappOperationalPayload = {
  status: string
  connected: boolean
  authenticated: boolean
  sessionLoaded: boolean
  lastEventAt: string | null
  lastEventName: string | null
  lastMessageAt: string | null
  operationalMessage: string | null
}

const STATUS_LABEL: Record<string, string> = {
  connected: 'CONNECTED',
  connecting: 'CONNECTING',
  disconnected: 'DISCONNECTED',
  qr: 'CONNECTING',
}

const STATUS_CLASS: Record<string, string> = {
  connected: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  connecting: 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  disconnected: 'border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100',
  qr: 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
}

function formatTimestamp(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

export function WhatsappDiagnosticBanner() {
  const [payload, setPayload] = useState<WhatsappOperationalPayload | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      if (!response.ok) return
      const data = (await response.json()) as WhatsappOperationalPayload
      setPayload(data)
    } catch {
      setPayload(null)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
    const interval = setInterval(() => void loadStatus(), 5000)
    return () => clearInterval(interval)
  }, [loadStatus])

  if (!payload) return null

  const label = STATUS_LABEL[payload.status] ?? payload.status.toUpperCase()
  const className = STATUS_CLASS[payload.status] ?? STATUS_CLASS.disconnected

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <p>
          <span className="font-medium">WhatsApp:</span> {label}
        </p>
        <p>
          <span className="text-muted-foreground">Sessão:</span>{' '}
          {payload.sessionLoaded ? 'carregada' : 'ausente'}
        </p>
        <p>
          <span className="text-muted-foreground">Autenticado:</span>{' '}
          {payload.authenticated ? 'sim' : 'não'}
        </p>
        <p>
          <span className="text-muted-foreground">Último evento:</span>{' '}
          {payload.lastEventName ?? '—'} ({formatTimestamp(payload.lastEventAt)})
        </p>
        <p>
          <span className="text-muted-foreground">Última mensagem:</span>{' '}
          {formatTimestamp(payload.lastMessageAt)}
        </p>
      </div>
      {payload.operationalMessage ? (
        <p className="mt-2 font-medium text-amber-800 dark:text-amber-200">
          {payload.operationalMessage}
        </p>
      ) : null}
    </div>
  )
}
