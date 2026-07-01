'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogItem = {
  id: string
  level: LogLevel
  domain: string
  message: string
  metadata: Record<string, unknown> | null
  source: 'app' | 'launcher'
  createdAt: string
}

type LevelFilter = 'all' | 'error'

const DOMAIN_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'api', label: 'API' },
  { value: 'ai', label: 'IA' },
  { value: 'launcher', label: 'Launcher' },
  { value: 'system', label: 'Sistema' },
  { value: 'assistant', label: 'Assistente' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'database', label: 'Database' },
] as const

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function levelClass(level: LogLevel): string {
  switch (level) {
    case 'error':
      return 'bg-red-500/10 text-red-500'
    case 'warn':
      return 'bg-amber-500/10 text-amber-500'
    default:
      return 'text-muted-foreground'
  }
}

export function SettingsLogsTab() {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [domain, setDomain] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [items, setItems] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextBefore, setNextBefore] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (levelFilter === 'error') params.set('level', 'error')
    if (domain) params.set('domain', domain)
    if (search) params.set('search', search)
    params.set('limit', '200')
    params.set('includeLauncher', 'true')
    return params.toString()
  }, [levelFilter, domain, search])

  const load = useCallback(
    async (before?: string | null, append = false) => {
      if (!append) setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams(queryString)
        if (before) params.set('before', before)
        const res = await fetch(`/api/settings/logs?${params.toString()}`)
        if (!res.ok) {
          setError('Não foi possível carregar os logs. Verifique se o servidor está rodando.')
          if (!append) setItems([])
          return
        }
        const contentType = res.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          setError(
            'Resposta inválida do servidor. Verifique se o Prisma está configurado (rode o .bat novamente).',
          )
          if (!append) setItems([])
          return
        }
        const data = (await res.json()) as {
          items: LogItem[]
          hasMore: boolean
          nextBefore: string | null
        }
        setItems((prev) => (append ? [...prev, ...data.items] : data.items))
        setHasMore(data.hasMore)
        setNextBefore(data.nextBefore)
      } catch {
        setError('Não foi possível carregar os logs. Verifique se o servidor está rodando.')
        if (!append) setItems([])
      } finally {
        setLoading(false)
      }
    },
    [queryString],
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      void load()
    }, 5000)
    return () => clearInterval(id)
  }, [autoRefresh, load])

  async function copyVisible() {
    const text = items
      .map((item) => `[${item.createdAt}] [${item.level}] [${item.domain}] ${item.message}`)
      .join('\n')
    await navigator.clipboard.writeText(text)
    setActionMessage('Logs copiados para a área de transferência.')
  }

  async function exportLogs() {
    const params = new URLSearchParams()
    if (levelFilter === 'error') params.set('level', 'error')
    window.open(`/api/settings/logs/export?${params.toString()}`, '_blank')
  }

  async function clearLogs() {
    if (!window.confirm('Apagar todos os logs salvos no banco? O arquivo launcher.log não será removido.')) {
      return
    }
    const res = await fetch('/api/settings/logs', { method: 'DELETE' })
    if (!res.ok) {
      setActionMessage('Falha ao limpar logs.')
      return
    }
    setActionMessage('Logs do banco apagados.')
    await load()
  }

  return (
    <div className="space-y-4">
      <Card className="border-neon-green/30 bg-neon-green/5">
        <CardContent className="pt-4 text-sm">
          <strong>Enviar logs ao suporte:</strong> clique em Exportar, envie o arquivo .txt por WhatsApp ou
          e-mail. Não inclui suas API keys (mascaradas automaticamente).
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Logs do sistema</CardTitle>
          <p className="text-sm text-muted-foreground">
            Erros e eventos para diagnóstico. Exporte e envie ao suporte se precisar de ajuda.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-md border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={levelFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setLevelFilter('all')}
              >
                Todos
              </Button>
              <Button
                type="button"
                size="sm"
                variant={levelFilter === 'error' ? 'default' : 'outline'}
                onClick={() => setLevelFilter('error')}
              >
                Somente erros
              </Button>
            </div>

            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              {DOMAIN_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              className="min-w-[180px] flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
              placeholder="Buscar no texto..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Atualizar automaticamente
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void copyVisible()}>
              Copiar visíveis
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void exportLogs()}>
              Exportar .txt
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void clearLogs()}>
              Limpar logs
            </Button>
          </div>

          {actionMessage ? <p className="text-sm text-neon-green">{actionMessage}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-md border p-2">
            {loading && items.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando logs…</p>
            ) : null}
            {!loading && items.length === 0 && !error ? (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhum log registrado ainda. Use o app normalmente; erros aparecerão aqui automaticamente.
              </p>
            ) : null}
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-md border border-border/40 p-2 text-sm ${levelClass(item.level)}`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs opacity-80">
                  <span>{formatTimestamp(item.createdAt)}</span>
                  <span className="rounded-full border px-2 py-0.5">{item.domain}</span>
                  {item.source === 'launcher' ? (
                    <span className="rounded-full border px-2 py-0.5">launcher</span>
                  ) : null}
                  <span className="uppercase">{item.level}</span>
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm">{item.message}</pre>
                {item.metadata && Object.keys(item.metadata).length > 0 ? (
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>

          {hasMore && nextBefore ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void load(nextBefore, true)}>
              Carregar mais
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
