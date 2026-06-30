'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export type ProviderRow = {
  id: string
  provider: string
  displayName: string
  apiKeyMasked: string
  model: string | null
  baseUrl: string | null
  isDefault: boolean
  enabled: boolean
}

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: 'Compatível OpenAI' },
] as const

const PROVIDER_DEFAULT_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  custom: 'API compatível',
}

type Props = {
  providers: ProviderRow[]
  loading: boolean
  onReload: () => Promise<void>
}

export function ProviderSettingsPanel({ providers, loading, onReload }: Props) {
  const [form, setForm] = useState({
    provider: 'openai',
    displayName: '',
    apiKey: '',
    model: '',
    baseUrl: '',
  })
  const [providerError, setProviderError] = useState<string | null>(null)
  const [providerSuccess, setProviderSuccess] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ apiKey: '', model: '', baseUrl: '' })
  const [rowError, setRowError] = useState<string | null>(null)

  async function addProvider() {
    setProviderError(null)
    setProviderSuccess(null)
    if (!form.displayName.trim()) {
      setProviderError('Informe um nome exibido (ex: Minha Gemini)')
      return
    }
    if (!form.apiKey.trim()) {
      setProviderError('Informe a API key')
      return
    }
    const res = await fetch('/api/settings/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setProviderError(data.error ?? `Erro ${res.status}`)
      return
    }
    setProviderSuccess('Provedor salvo com sucesso')
    setForm({ provider: 'openai', displayName: '', apiKey: '', model: '', baseUrl: '' })
    await onReload()
  }

  async function testProvider(id: string) {
    const res = await fetch(`/api/settings/providers/${id}/test`, { method: 'POST' })
    const data = (await res.json()) as { ok: boolean; sample?: string; error?: string }
    window.alert(data.ok ? `Conexão OK: ${data.sample ?? ''}` : `Falha: ${data.error ?? 'erro'}`)
  }

  function startEdit(row: ProviderRow) {
    setEditingId(row.id)
    setRowError(null)
    setEditForm({
      apiKey: '',
      model: row.model ?? '',
      baseUrl: row.baseUrl ?? '',
    })
  }

  async function saveEdit(id: string) {
    setRowError(null)
    const res = await fetch(`/api/settings/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: editForm.apiKey.trim() || undefined,
        model: editForm.model.trim() || null,
        baseUrl: editForm.baseUrl.trim() || null,
      }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setRowError(data.error ?? `Erro ${res.status}`)
      return
    }
    setEditingId(null)
    await onReload()
  }

  async function removeProvider(id: string, name: string) {
    if (!window.confirm(`Remover o provedor "${name}"?`)) return
    const res = await fetch(`/api/settings/providers/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      window.alert(data.error ?? 'Falha ao remover')
      return
    }
    if (editingId === id) setEditingId(null)
    await onReload()
  }

  function onProviderTypeChange(provider: string) {
    setForm((f) => ({
      ...f,
      provider,
      displayName: f.displayName.trim() ? f.displayName : (PROVIDER_DEFAULT_NAMES[provider] ?? ''),
    }))
  }

  return (
    <>
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Adicionar provedor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={form.provider}
            onChange={(e) => onProviderTypeChange(e.target.value)}
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Nome exibido"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
          <div className="md:col-span-2">
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="API key"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            />
            {form.provider === 'gemini' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Gemini funciona para Chat, Vision e Assistente. Para transcrição de áudio, use OpenAI
                (Whisper).
              </p>
            ) : null}
          </div>
          <input
            className="rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Modelo (opcional)"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
          <input
            className="rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Base URL (opcional)"
            value={form.baseUrl}
            onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
          />
          {providerError ? (
            <p className="text-sm text-destructive md:col-span-2">{providerError}</p>
          ) : null}
          {providerSuccess ? (
            <p className="text-sm text-neon-green md:col-span-2">{providerSuccess}</p>
          ) : null}
          <Button type="button" onClick={() => void addProvider()}>
            Salvar provedor
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Provedores cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map((row) => (
            <div key={row.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {row.displayName} ({row.provider})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.apiKeyMasked} · {row.model ?? 'modelo padrão'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void testProvider(row.id)}>
                    Testar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void removeProvider(row.id, row.displayName)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
              {editingId === row.id ? (
                <div className="mt-3 grid gap-2 border-t border-border/40 pt-3 md:grid-cols-2">
                  <input
                    className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
                    placeholder="Nova API key (deixe vazio para manter)"
                    type="password"
                    value={editForm.apiKey}
                    onChange={(e) => setEditForm((f) => ({ ...f, apiKey: e.target.value }))}
                  />
                  <input
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Modelo"
                    value={editForm.model}
                    onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))}
                  />
                  <input
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Base URL"
                    value={editForm.baseUrl}
                    onChange={(e) => setEditForm((f) => ({ ...f, baseUrl: e.target.value }))}
                  />
                  {rowError ? (
                    <p className="text-sm text-destructive md:col-span-2">{rowError}</p>
                  ) : null}
                  <div className="flex gap-2 md:col-span-2">
                    <Button type="button" size="sm" onClick={() => void saveEdit(row.id)}>
                      Salvar alterações
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {!loading && providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum provedor cadastrado — adicione uma chave de API para habilitar IA.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </>
  )
}
