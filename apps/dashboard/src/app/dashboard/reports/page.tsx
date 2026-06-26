'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatChatListLabel } from '@finance-ai/shared/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthPicker, currentMonthSelection, type MonthSelection } from '@/components/dashboard/month-picker'

type ReportRow = {
  id: string
  chatId: string
  displayNumber?: number
  displayLabel?: string
  chatName?: string | null
  reportDate: string
  content: string
  generatedAt: string
}

export default function ReportsPage() {
  const [month, setMonth] = useState<MonthSelection>(currentMonthSelection)
  const [chatId, setChatId] = useState('')
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ReportRow | null>(null)
  const [generating, setGenerating] = useState(false)

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        year: String(month.year),
        month: String(month.month),
      })
      if (chatId.trim()) params.set('chatId', chatId.trim())
      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) return
      const data = (await response.json()) as { items: ReportRow[] }
      setReports(data.items ?? [])
      if (data.items?.[0]) setSelected(data.items[0])
    } finally {
      setLoading(false)
    }
  }, [chatId, month])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  async function generateManual() {
    if (!chatId.trim()) return
    setGenerating(true)
    try {
      await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim() }),
      })
      await loadReports()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumos diários por chat com tópicos e horários.
          </p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[240px] flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Filtrar por chatId"
          value={chatId}
          onChange={(event) => setChatId(event.target.value)}
        />
        <button
          type="button"
          disabled={!chatId.trim() || generating}
          onClick={() => void generateManual()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted/40 disabled:opacity-50"
        >
          {generating ? 'Gerando…' : 'Gerar hoje'}
        </button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Por data</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[480px] space-y-2 overflow-y-auto">
            {reports.map((report) => {
              const label =
                report.displayLabel && report.chatName
                  ? formatChatListLabel(report.displayNumber ?? 0, report.chatName)
                  : report.chatId
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelected(report)}
                  className={`block w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40 ${
                    selected?.id === report.id ? 'border-neon-orange/50 bg-muted/30' : ''
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(report.reportDate).toLocaleDateString('pt-BR')}
                  </div>
                </button>
              )
            })}
            {!loading && reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum relatório neste período.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{selected.content}</pre>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione um relatório.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
