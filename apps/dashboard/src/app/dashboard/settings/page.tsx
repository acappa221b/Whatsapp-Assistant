'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type ProviderRow = {
  id: string
  provider: string
  displayName: string
  apiKeyMasked: string
  model: string | null
  baseUrl: string | null
  isDefault: boolean
  enabled: boolean
}

type AppSettings = {
  appName: string
  timezone: string
  port: number
  companyName: string
  databasePath: string
  whatsappSessionPath: string
  mediaStoragePath: string
  whatsappAutoReconnect: boolean
  whatsappReconnectDelayMs: number
  whatsappIgnoreHistory: boolean
  setupCompleted: boolean
  defaultChatProviderId: string | null
  defaultTranscriptionProviderId: string | null
  defaultVisionProviderId: string | null
  defaultReportProviderId: string | null
  defaultAssistantProviderId: string | null
  reportAutoEnabled: boolean
  reportAutoTime: string
  reportTimezone: string
}

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: 'Compatível OpenAI' },
] as const

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Carregando configurações…</p>}>
      <SettingsPageContent />
    </Suspense>
  )
}

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const showWelcome = searchParams.get('welcome') === '1'

  const [providers, setProviders] = useState<ProviderRow[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [pathsOpen, setPathsOpen] = useState(false)
  const [form, setForm] = useState({
    provider: 'openai',
    displayName: '',
    apiKey: '',
    model: '',
    baseUrl: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [providersRes, settingsRes] = await Promise.all([
        fetch('/api/settings/providers'),
        fetch('/api/settings'),
      ])
      if (providersRes.ok) {
        const data = (await providersRes.json()) as { items: ProviderRow[] }
        setProviders(data.items ?? [])
      }
      if (settingsRes.ok) {
        setSettings((await settingsRes.json()) as AppSettings)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addProvider() {
    if (!form.displayName.trim() || !form.apiKey.trim()) return
    await fetch('/api/settings/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ provider: 'openai', displayName: '', apiKey: '', model: '', baseUrl: '' })
    await load()
  }

  async function testProvider(id: string) {
    const res = await fetch(`/api/settings/providers/${id}/test`, { method: 'POST' })
    const data = (await res.json()) as { ok: boolean; sample?: string; error?: string }
    window.alert(data.ok ? `Conexão OK: ${data.sample ?? ''}` : `Falha: ${data.error ?? 'erro'}`)
  }

  async function patchSettings(payload: Partial<AppSettings>) {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) await load()
  }

  async function updateDefault(field: keyof AppSettings, value: string) {
    if (!settings) return
    await patchSettings({ [field]: value || null })
  }

  async function dismissWelcome() {
    await patchSettings({ setupCompleted: true })
  }

  const needsSetup = settings && !settings.setupCompleted

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="space-y-6 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aplicativo, provedores de IA e agendamento — tudo pelo dashboard, sem arquivo .env.
          </p>
        </div>

        {(showWelcome || needsSetup) && settings ? (
          <Card className="border-neon-green/40 bg-neon-green/5">
            <CardHeader>
              <CardTitle className="text-base">Bem-vindo — configure em poucos passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal space-y-1 pl-5">
                <li className={providers.length > 0 ? 'text-muted-foreground line-through' : ''}>
                  Adicione um provedor de IA (OpenAI, Gemini ou DeepSeek) abaixo
                </li>
                <li>
                  Vá em <a href="/dashboard/whatsapp" className="underline">WhatsApp</a> e escaneie o QR Code
                </li>
                <li>
                  Em <a href="/dashboard/permissions" className="underline">Permissões</a>, habilite os chats desejados
                </li>
              </ol>
              <Button type="button" size="sm" variant="outline" onClick={() => void dismissWelcome()}>
                Concluir configuração inicial
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

        {settings ? (
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Aplicativo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Nome do assistente</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={settings.appName}
                  onChange={(e) => setSettings((s) => (s ? { ...s, appName: e.target.value } : s))}
                  onBlur={() => void patchSettings({ appName: settings.appName })}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Fuso horário</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={settings.timezone}
                  onChange={(e) => setSettings((s) => (s ? { ...s, timezone: e.target.value } : s))}
                  onBlur={() => void patchSettings({ timezone: settings.timezone })}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Porta local</span>
                <input
                  type="number"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={settings.port}
                  onChange={(e) =>
                    setSettings((s) => (s ? { ...s, port: Number(e.target.value) || 4000 } : s))
                  }
                  onBlur={() => void patchSettings({ port: settings.port })}
                />
                <span className="mt-1 block text-xs text-muted-foreground">Reinicie o app após alterar a porta.</span>
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={settings.whatsappAutoReconnect}
                  onChange={(e) => void patchSettings({ whatsappAutoReconnect: e.target.checked })}
                />
                Reconexão automática do WhatsApp
              </label>
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="text-sm text-muted-foreground underline"
                  onClick={() => setPathsOpen((o) => !o)}
                >
                  {pathsOpen ? 'Ocultar' : 'Mostrar'} caminhos de armazenamento
                </button>
                {pathsOpen ? (
                  <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                    <li>DB: {settings.databasePath}</li>
                    <li>Sessão: {settings.whatsappSessionPath}</li>
                    <li>Mídia: {settings.mediaStoragePath}</li>
                  </ul>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Adicionar provedor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
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
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
              placeholder="API key"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            />
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
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {row.displayName} ({row.provider})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.apiKeyMasked} · {row.model ?? 'modelo padrão'}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => void testProvider(row.id)}>
                  Testar
                </Button>
              </div>
            ))}
            {!loading && providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum provedor cadastrado — adicione uma chave de API para habilitar IA.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {settings ? (
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Provedor por função</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {(
                [
                  ['defaultChatProviderId', 'Chat / Resposta automática'],
                  ['defaultTranscriptionProviderId', 'Transcrição áudio'],
                  ['defaultVisionProviderId', 'Vision / Fotos'],
                  ['defaultReportProviderId', 'Relatórios'],
                  ['defaultAssistantProviderId', 'Chat Assistente'],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="text-sm">
                  <span className="mb-1 block text-muted-foreground">{label}</span>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={settings[field] ?? ''}
                    onChange={(e) => void updateDefault(field, e.target.value)}
                  >
                    <option value="">Primeiro habilitado</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
