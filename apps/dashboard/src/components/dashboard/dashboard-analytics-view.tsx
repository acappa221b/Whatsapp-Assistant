'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardMetrics, CostCategoryFilter } from '@finance-ai/core/domains/dashboard-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthPicker, currentMonthSelection, type MonthSelection } from './month-picker'

function DailyBarChart({
  title,
  data,
  valueLabel,
  color = 'hsl(var(--neon-orange))',
}: {
  title: string
  data: Array<{ date: string; count: number }>
  valueLabel: string
  color?: string
}) {
  const chartData = data.map((point) => ({
    day: point.date.slice(8),
    count: point.count,
  }))

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
            <Tooltip formatter={(value: number) => [value, valueLabel]} />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DashboardAnalyticsView() {
  const [month, setMonth] = useState<MonthSelection>(currentMonthSelection)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [costFilter, setCostFilter] = useState<CostCategoryFilter>('total')

  const loadMetrics = useCallback(async (selection: MonthSelection) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        year: String(selection.year),
        month: String(selection.month),
      })
      const response = await fetch(`/api/dashboard/metrics?${params}`)
      if (!response.ok) {
        setError('Falha ao carregar métricas')
        return
      }
      setMetrics((await response.json()) as DashboardMetrics)
    } catch {
      setError('Erro de rede ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMetrics(month)
  }, [loadMetrics, month])

  const costDataForChart =
    costFilter === 'total'
      ? metrics?.costs.costBrl ?? []
      : metrics?.costs.costByCategory[costFilter as Exclude<CostCategoryFilter, 'total'>] ?? []

  const monthCostTotal =
    metrics?.costs.costBrl.reduce((sum, point) => sum + point.count, 0) ?? 0

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Métricas reais de mensagens, usuários e custos de API.
          </p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading && !metrics ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      {metrics ? (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Geral</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <DailyBarChart title="Mensagens" data={metrics.general.messages} valueLabel="mensagens" />
              <DailyBarChart
                title="Mensagens IA"
                data={metrics.general.agentMessages}
                valueLabel="respostas IA"
                color="hsl(var(--neon-pink))"
              />
              <DailyBarChart
                title="Usuários Ativos"
                data={metrics.general.activeUsers}
                valueLabel="usuários"
                color="hsl(var(--neon-green))"
              />
              <DailyBarChart title="Fotos" data={metrics.general.photos} valueLabel="fotos" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Gastos</h2>
            <Card className="border-border/60 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gasto estimado no mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold">{formatBrl(monthCostTotal)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Valores estimados conforme tabela de preços por provedor/modelo.
                </p>
              </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <DailyBarChart
                title="Token Usage"
                data={metrics.costs.tokenUsage}
                valueLabel="tokens"
                color="hsl(var(--neon-orange))"
              />
              <DailyBarChart
                title="Tokens — Mensagens"
                data={metrics.costs.tokensByCategory.agent_message}
                valueLabel="tokens"
              />
              <DailyBarChart
                title="Tokens — Fotos"
                data={metrics.costs.tokensByCategory.photo_processing}
                valueLabel="tokens"
              />
              <DailyBarChart
                title="Tokens — Áudios"
                data={metrics.costs.tokensByCategory.audio_processing}
                valueLabel="tokens"
              />
              <DailyBarChart
                title="Tokens — Relatórios"
                data={metrics.costs.tokensByCategory.report_generation}
                valueLabel="tokens"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="cost-filter" className="text-sm text-muted-foreground">
                Custo API (R$)
              </label>
              <select
                id="cost-filter"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={costFilter}
                onChange={(event) => setCostFilter(event.target.value as CostCategoryFilter)}
              >
                <option value="total">Total</option>
                <option value="agent_message">Mensagens</option>
                <option value="photo_processing">Fotos</option>
                <option value="audio_processing">Áudios</option>
                <option value="report_generation">Relatórios</option>
              </select>
            </div>

            <DailyBarChart
              title={`Custo API (R$) — ${costFilter === 'total' ? 'Total' : costFilter}`}
              data={costDataForChart}
              valueLabel="R$"
              color="hsl(var(--neon-pink))"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  ['Mensagem', metrics.costs.averageCostBrl.agent_message],
                  ['Áudio', metrics.costs.averageCostBrl.audio_processing],
                  ['Foto', metrics.costs.averageCostBrl.photo_processing],
                  ['Relatório', metrics.costs.averageCostBrl.report_generation],
                ] as const
              ).map(([label, value]) => (
                <Card key={label} className="border-border/60 bg-card/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Custo médio — {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-xl font-semibold">{formatBrl(value)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
