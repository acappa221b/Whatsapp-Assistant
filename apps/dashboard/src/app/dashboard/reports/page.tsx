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

type ChatOption = {
  chatId: string
  displayNumber: number
  name: string | null
}

function yesterdayIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const [month, setMonth] = useState<MonthSelection>(currentMonthSelection)
  const [chatId, setChatId] = useState('')
  const [reportDate, setReportDate] = useState(yesterdayIso())
  const [chats, setChats] = useState<ChatOption[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ReportRow | null>(null)
  const [generating, setGenerating] = useState(false)
  const [autoEnabled, setAutoEnabled] = useState(true)
  const [autoTime, setAutoTime] = useState('23:00')
  const [savingSchedule, setSavingSchedule] = useState(false)

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

  useEffect(() => {
    void (async () => {
      const [chatsRes, scheduleRes] = await Promise.all([
        fetch('/api/whatsapp/chats'),
        fetch('/api/settings/reports'),
      ])
      if (chatsRes.ok) {
        const data = (await chatsRes.json()) as { items: ChatOption[] }
        setChats(
          (data.items ?? [])
            .filter((c) => c.chatId)
            .map((c) => ({
              chatId: c.chatId,
              displayNumber: c.displayNumber,
              name: c.name ?? null,
            })),
        )
      }
      if (scheduleRes.ok) {
        const data = (await scheduleRes.json()) as {
          reportAutoEnabled: boolean
          reportAutoTime: string
        }
        setAutoEnabled(data.reportAutoEnabled)
        setAutoTime(data.reportAutoTime)
      }
    })()
  }, [])

  async function generateManual() {
    if (!chatId.trim()) return
    setGenerating(true)
    try {
      await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim(), reportDate }),
      })
      await loadReports()
    } finally {
      setGenerating(false)
    }
  }

  async function saveSchedule() {
    setSavingSchedule(true)
    try {
      await fetch('/api/settings/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportAutoEnabled: autoEnabled, reportAutoTime: autoTime }),
      })
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumos diários por chat com tópicos e horários.
          </p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Agendamento automático</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoEnabled}
              onChange={(e) => setAutoEnabled(e.target.checked)}
            />
            Gerar automaticamente todo dia
          </label>
          <label className="text-sm">
            Horário (HH:mm)
            <input
              type="time"
              className="ml-2 rounded-md border bg-background px-2 py-1"
              value={autoTime}
              onChange={(e) => setAutoTime(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={savingSchedule}
            onClick={() => void saveSchedule()}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted/40"
          >
            {savingSchedule ? 'Salvando…' : 'Salvar agendamento'}
          </button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <select
          className="min-w-[240px] flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          value={chatId}
          onChange={(event) => setChatId(event.target.value)}
        >
          <option value="">Selecione o chat</option>
          {chats.map((chat) => (
            <option key={chat.chatId} value={chat.chatId}>
              {formatChatListLabel(chat.displayNumber, chat.name ?? chat.chatId)}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
        />
        <button
          type="button"
          disabled={!chatId.trim() || generating}
          onClick={() => void generateManual()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted/40 disabled:opacity-50"
        >
          {generating ? 'Gerando…' : 'Gerar agora'}
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
    </div>
  )
}
