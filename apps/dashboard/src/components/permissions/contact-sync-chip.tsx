'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { ContactSyncSnapshot } from '@/lib/whatsapp/contact-sync-tracker'

type SyncStatusResponse = ContactSyncSnapshot & { connected: boolean }

type ContactSyncChipProps = {
  onProcessedIncrease?: (processed: number) => void
  onSnapshotChange?: (snapshot: SyncStatusResponse) => void
}

export function ContactSyncChip({ onProcessedIncrease, onSnapshotChange }: ContactSyncChipProps) {
  const [snapshot, setSnapshot] = useState<SyncStatusResponse | null>(null)
  const lastProcessedRef = useRef(0)
  const snapshotRef = useRef<SyncStatusResponse | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/sync-status')
      if (!response.ok) return
      const data = (await response.json()) as SyncStatusResponse
      snapshotRef.current = data
      setSnapshot(data)
      onSnapshotChange?.(data)

      if (data.processed > lastProcessedRef.current) {
        lastProcessedRef.current = data.processed
        onProcessedIncrease?.(data.processed)
      }
    } catch {
      // ignore polling errors
    }
  }, [onProcessedIncrease, onSnapshotChange])

  useEffect(() => {
    void fetchStatus()
    let cancelled = false
    let timer: number | undefined

    const schedule = () => {
      const delay =
        snapshotRef.current?.status === 'completed' &&
        (snapshotRef.current?.processed ?? 0) > 0
          ? 10_000
          : 2_000
      timer = window.setTimeout(async () => {
        if (cancelled) return
        if (document.visibilityState === 'visible') await fetchStatus()
        schedule()
      }, delay)
    }

    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [fetchStatus])

  if (!snapshot) return null

  if (!snapshot.connected) {
    return (
      <span
        className="inline-flex h-6 items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-2 text-xs text-amber-950"
        title="Conecte o WhatsApp em Configurações"
      >
        ⚠ Desconectado
      </span>
    )
  }

  if (snapshot.status === 'error') {
    return (
      <span
        className="inline-flex h-6 items-center rounded-full border border-red-300/60 bg-red-50 px-2 text-xs text-red-950"
        title={snapshot.lastError ?? 'Falha na sincronização'}
      >
        Erro sync
      </span>
    )
  }

  if (snapshot.status === 'syncing') {
    return (
      <span className="inline-flex h-6 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Sincronizando…
        {snapshot.processed > 0 ? <span className="text-muted-foreground">({snapshot.processed})</span> : null}
      </span>
    )
  }

  if (snapshot.status === 'completed') {
    return (
      <span
        className="inline-flex h-6 items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-50/80 px-2 text-xs text-emerald-900"
        title={snapshot.message ?? undefined}
      >
        <span className="text-emerald-600">●</span>
        Sincronizado
      </span>
    )
  }

  if (snapshot.processed === 0) {
    return (
      <span
        className="inline-flex h-6 items-center rounded-full border border-border/60 bg-muted/30 px-2 text-xs text-muted-foreground"
        title="Aguardando sincronização ou mensagens"
      >
        Aguardando
      </span>
    )
  }

  return null
}

export type { SyncStatusResponse }
