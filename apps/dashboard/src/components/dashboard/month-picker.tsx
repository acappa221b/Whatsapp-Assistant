'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export type MonthSelection = { year: number; month: number }

type MonthPickerProps = {
  value: MonthSelection
  onChange: (value: MonthSelection) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const label = useMemo(
    () => `${MONTH_LABELS[value.month - 1]} ${value.year}`,
    [value.month, value.year],
  )

  function shift(delta: number) {
    let month = value.month + delta
    let year = value.year
    while (month < 1) {
      month += 12
      year -= 1
    }
    while (month > 12) {
      month -= 12
      year += 1
    }
    onChange({ year, month })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Mês anterior"
        className="rounded-md border p-2 hover:bg-muted/40"
        onClick={() => shift(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <select
        aria-label="Selecionar mês"
        className="rounded-md border bg-background px-3 py-2 text-sm"
        value={`${value.year}-${value.month}`}
        onChange={(event) => {
          const [yearStr, monthStr] = event.target.value.split('-')
          const year = Number(yearStr)
          const month = Number(monthStr)
          if (Number.isFinite(year) && Number.isFinite(month)) {
            onChange({ year, month })
          }
        }}
      >
        {buildMonthOptions().map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="hidden text-sm text-muted-foreground sm:inline">{label}</span>
      <button
        type="button"
        aria-label="Próximo mês"
        className="rounded-md border p-2 hover:bg-muted/40"
        onClick={() => shift(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function buildMonthOptions(): Array<{ key: string; label: string }> {
  const now = new Date()
  const options: Array<{ key: string; label: string }> = []
  for (let offset = -11; offset <= 0; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    options.push({
      key: `${year}-${month}`,
      label: `${MONTH_LABELS[month - 1]} ${year}`,
    })
  }
  return options.reverse()
}

export function currentMonthSelection(): MonthSelection {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
