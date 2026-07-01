'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { ContactSyncSnapshot, SyncedContactEntry } from '@/lib/whatsapp/contact-sync-tracker'

type SyncStatusResponse = ContactSyncSnapshot & { connected: boolean }

const SOURCE_LABELS: Record<SyncedContactEntry['source'], string> = {
  'messaging-history': 'histórico',
  'chats.upsert': 'chat',
  'groups.upsert': 'grupo',
  'contacts.upsert': 'contato',
  message: 'mensagem',
  bootstrap: 'bootstrap',
}

function formatSyncTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type ContactSyncBannerProps = {
  onProcessedIncrease?: (processed: number) => void
}

export function ContactSyncBanner({ onProcessedIncrease }: ContactSyncBannerProps) {
  const [snapshot, setSnapshot] = useState<SyncStatusResponse | null>(null)
  const [showRecent, setShowRecent] = useState(false)
  const [completedVisible, setCompletedVisible] = useState(false)
  const lastProcessedRef = useRef(0)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/sync-status')
      if (!response.ok) return
      const data = (await response.json()) as SyncStatusResponse
      setSnapshot(data)

      if (data.processed > lastProcessedRef.current) {
        lastProcessedRef.current = data.processed
        onProcessedIncrease?.(data.processed)
      }

      if (data.status === 'completed' && data.processed > 0) {
        setCompletedVisible(true)
        window.setTimeout(() => setCompletedVisible(false), 5000)
      }
    } catch {
      // ignore polling errors
    }
  }, [onProcessedIncrease])

  useEffect(() => {
    void fetchStatus()
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchStatus()
    }, 2000)
    return () => window.clearInterval(interval)
  }, [fetchStatus])

  if (!snapshot) return null

  if (!snapshot.connected) {
    return (
      <div className="rounded-lg border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        Conecte o WhatsApp em Configurações para sincronizar contatos.
      </div>
    )
  }

  if (snapshot.status === 'error') {
    return (
      <div className="rounded-lg border border-red-400/60 bg-red-50/80 px-4 py-3 text-sm text-red-950">
        <p>{snapshot.lastError ?? 'Falha na sincronização de contatos.'}</p>
        <Link
          href="/dashboard/settings?tab=logs"
          className="mt-1 inline-block text-xs underline"
        >
          Ver detalhes em Configurações → Logs (domínio WhatsApp)
        </Link>
      </div>
    )
  }

  if (snapshot.status === 'syncing') {
    return (
      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
          <span>
            {snapshot.message ?? 'Sincronizando…'}{' '}
            <span className="text-muted-foreground">
              ({snapshot.processed} contato(s) processado(s))
            </span>
          </span>
        </div>
        {snapshot.recent.length > 0 ? (
          <div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowRecent((value) => !value)}
            >
              Últimos sincronizados
              {showRecent ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showRecent ? (
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {snapshot.recent.map((entry) => (
                  <li key={`${entry.chatId}-${entry.at}`}>
                    {entry.name?.trim() || entry.chatId} · {SOURCE_LABELS[entry.source]} ·{' '}
                    {formatSyncTime(entry.at)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  if (completedVisible && snapshot.processed > 0) {
    return (
      <div className="rounded-lg border border-emerald-400/50 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
        Sincronização concluída
      </div>
    )
  }

  if (snapshot.status === 'completed' && snapshot.processed === 0 && snapshot.message) {
    return (
      <div className="rounded-lg border border-sky-400/50 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
        {snapshot.message}
        <p className="mt-1 text-xs text-sky-800">
          Aguardando conversas do WhatsApp… Os chats são listados quando há mensagens trocadas.
        </p>
      </div>
    )
  }

  return null
}
