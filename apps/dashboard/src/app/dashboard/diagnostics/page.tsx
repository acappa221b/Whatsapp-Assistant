'use client'

import { useCallback, useEffect, useState } from 'react'

type FidelityMetrics = {
  totalMessages: number
  extractedTexts: number
  textEmpty: number
  imagesTotal: number
  imagesWithCaption: number
  imagesWithoutCaption: number
  imagesProcessed: number
  imagesWithoutExtraction: number
  chatsResolved: number
  chatsFallback: number
  senderResolved: number
  senderFallback: number
  textExtractionRate: number
  contactResolutionRate: number
  imageExtractionRate: number
}

type ArchiveHealth = {
  received: number
  mapped: number
  persisted: number
  failed: number
  ignored: number
  lossRate: number
  unknownTypes: Record<string, number>
  wrappersEncountered: Record<string, number>
}

type ArchiveMetrics = {
  types: Record<string, number>
  emptyTextCount: number
  totalPersisted: number
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function MetricCard(props: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-xs text-muted-foreground">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold">{props.value}</p>
      {props.hint ? <p className="mt-1 text-xs text-muted-foreground">{props.hint}</p> : null}
    </div>
  )
}

function KeyValueList(props: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(props.data)
  if (entries.length === 0) return null
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-sm font-medium">{props.title}</h2>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {entries.map(([key, count]) => (
          <li key={key} className="flex justify-between rounded-md bg-muted/30 px-3 py-2">
            <span className="truncate pr-2">{key}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DiagnosticsPage() {
  const [fidelity, setFidelity] = useState<FidelityMetrics | null>(null)
  const [health, setHealth] = useState<ArchiveHealth | null>(null)
  const [archive, setArchive] = useState<ArchiveMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [fidelityRes, healthRes, metricsRes] = await Promise.all([
        fetch('/api/whatsapp/fidelity'),
        fetch('/api/whatsapp/archive/health'),
        fetch('/api/whatsapp/metrics'),
      ])
      if (!fidelityRes.ok) throw new Error('Falha ao carregar métricas de fidelidade')
      if (!healthRes.ok) throw new Error('Falha ao carregar saúde do arquivo')
      if (!metricsRes.ok) throw new Error('Falha ao carregar métricas de arquivo')
      setFidelity((await fidelityRes.json()) as FidelityMetrics)
      setHealth((await healthRes.json()) as ArchiveHealth)
      const metricsData = (await metricsRes.json()) as ArchiveMetrics & { totalPersisted?: number }
      setArchive({
        types: metricsData.types ?? {},
        emptyTextCount: metricsData.emptyTextCount ?? 0,
        totalPersisted: metricsData.totalPersisted ?? 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 10_000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Diagnóstico RC-07</h1>
        <p className="text-sm text-muted-foreground">
          Message Archive — fidelidade, perda zero, wrappers e identidade de contatos.
        </p>
      </div>

      {loading && !fidelity ? <p className="text-sm">Carregando...</p> : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {health ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Loss rate (runtime)"
            value={pct(health.lossRate)}
            hint={`${health.received} recebidas · ${health.persisted} persistidas`}
          />
          <MetricCard label="Mapeadas" value={health.mapped} />
          <MetricCard label="Falhas persistência" value={health.failed} hint={`${health.ignored} ignoradas`} />
        </div>
      ) : null}

      {fidelity ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total mensagens (DB)" value={fidelity.totalMessages} />
            <MetricCard
              label="Taxa texto extraído"
              value={pct(fidelity.textExtractionRate)}
              hint={`${fidelity.extractedTexts} ok · ${fidelity.textEmpty} vazios`}
            />
            <MetricCard
              label="Taxa resolução contato"
              value={pct(fidelity.contactResolutionRate)}
              hint={`${fidelity.chatsResolved} ok · ${fidelity.chatsFallback} fallback`}
            />
            <MetricCard
              label="Imagens sem legenda"
              value={fidelity.imagesWithoutCaption}
              hint={`${fidelity.imagesTotal} total · OCR fora de escopo`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="TEXT vazios" value={fidelity.textEmpty} />
            <MetricCard label="Chats fallback" value={fidelity.chatsFallback} />
            <MetricCard
              label="Áudios (aguardando Whisper)"
              value={archive?.types.AUDIO ?? 0}
              hint="Processor NOT_IMPLEMENTED — audit only"
            />
          </div>
        </>
      ) : null}

      {health ? (
        <>
          <KeyValueList title="Wrappers encontrados (sessão)" data={health.wrappersEncountered} />
          <KeyValueList title="Tipos desconhecidos / ignorados" data={health.unknownTypes} />
        </>
      ) : null}

      {archive ? (
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium">Tipos persistidos (DB)</h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(archive.types).map(([type, count]) => (
              <li key={type} className="flex justify-between rounded-md bg-muted/30 px-3 py-2">
                <span>{type}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void load()}
        className="rounded-md border px-4 py-2 text-sm hover:bg-muted/40"
      >
        Atualizar
      </button>
    </div>
  )
}
