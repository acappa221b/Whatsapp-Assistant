'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type StatusPayload = {
  connected: boolean
  lastConnectedAt: string | null
}

function formatBrDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function WhatsappHeaderStatus() {
  const [status, setStatus] = useState<StatusPayload>({ connected: false, lastConnectedAt: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/whatsapp/status')
        if (!response.ok) return
        const data = (await response.json()) as StatusPayload
        if (!cancelled) setStatus(data)
      } catch {
        // ignore transient network errors
      }
    }

    void load()
    const interval = setInterval(() => void load(), 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <Link href="/dashboard/settings?tab=whatsapp" className="text-xs text-muted-foreground underline">
        Configurações → WhatsApp
      </Link>
      <span className={status.connected ? 'text-emerald-600' : 'text-red-600'}>
        Status: {status.connected ? 'Connected' : 'Disconnected'}
      </span>
      <span className="text-muted-foreground">
        Última conexão: {formatBrDateTime(status.lastConnectedAt)}
      </span>
    </div>
  )
}
