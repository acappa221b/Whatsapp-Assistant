'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WhatsappConnectionPanel } from '@/components/whatsapp/whatsapp-connection-panel'
import { AiTrainingTab } from '@/components/settings/ai-training/ai-training-tab'
import { SettingsAboutSection } from '@/components/settings/settings-about-section'
import { ProviderSettingsPanel } from '@/components/settings/provider-settings-panel'
import { SettingsLogsTab } from '@/components/settings/settings-logs-tab'

const TABS = ['geral', 'provedores', 'ia', 'whatsapp', 'relatorios', 'logs'] as const
type TabId = (typeof TABS)[number]

const TAB_LABELS: Record<TabId, string> = {
  geral: 'Geral',
  provedores: 'Provedores IA',
  ia: 'IA',
  whatsapp: 'WhatsApp',
  relatorios: 'Relatórios',
  logs: 'Logs',
}

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
  syncGroupsEnabled: boolean
  syncAddressBookEnabled: boolean
  syncChatsMetadataEnabled: boolean
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
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState<TabId>('geral')

  const [providers, setProviders] = useState<ProviderRow[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [pathsOpen, setPathsOpen] = useState(false)

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

  useEffect(() => {
    if (tabParam && TABS.includes(tabParam as TabId)) {
      setTab(tabParam as TabId)
    }
  }, [tabParam])

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
                  Vá na aba <button type="button" className="underline" onClick={() => setTab('whatsapp')}>WhatsApp</button> e escaneie o QR Code
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

        <div className="flex flex-wrap gap-2 border-b border-border/60 pb-2">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === id ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/40'
              }`}
            >
              {TAB_LABELS[id]}
            </button>
          ))}
        </div>

        {tab === 'geral' && settings ? (
          <>
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
                <span className="mb-1 block text-muted-foreground">Nome da empresa (modo empresa)</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings((s) => (s ? { ...s, companyName: e.target.value } : s))
                  }
                  onBlur={() => void patchSettings({ companyName: settings.companyName })}
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
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Sobre</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsAboutSection />
            </CardContent>
          </Card>
          </>
        ) : null}

        {tab === 'provedores' ? (
        <>
        <ProviderSettingsPanel providers={providers} loading={loading} onReload={load} />

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
        </>
        ) : null}

        {tab === 'ia' ? <AiTrainingTab /> : null}

        {tab === 'whatsapp' ? (
          <>
            <Card className="border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Conexao WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <WhatsappConnectionPanel />
              </CardContent>
            </Card>
            {settings ? (
              <Card className="border-border/60 bg-card/60">
                <CardHeader>
                  <CardTitle className="text-base">Sincronizacao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={!settings.whatsappIgnoreHistory}
                      onChange={(e) =>
                        void patchSettings({ whatsappIgnoreHistory: !e.target.checked })
                      }
                    />
                    <span>
                      Importar historico recente ao conectar
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Pode demorar e consumir mais dados na primeira conexao. Desligado por
                        padrao: apenas mensagens novas entram no app.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={settings.syncGroupsEnabled}
                      onChange={(e) =>
                        void patchSettings({ syncGroupsEnabled: e.target.checked })
                      }
                    />
                    <span>
                      Sincronizar grupos automaticamente
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Desligado por padrao. Grupos so aparecem em Permissoes apos receber
                        mensagem no grupo ou habilitar manualmente.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={settings.syncAddressBookEnabled}
                      onChange={(e) =>
                        void patchSettings({ syncAddressBookEnabled: e.target.checked })
                      }
                    />
                    <span>
                      Sincronizar agenda de contatos
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Desligado por padrao. Contatos da agenda nao populam Permissoes sem
                        mensagem.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={settings.syncChatsMetadataEnabled}
                      onChange={(e) =>
                        void patchSettings({ syncChatsMetadataEnabled: e.target.checked })
                      }
                    />
                    <span>
                      Sincronizar lista de conversas do WhatsApp
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Desligado por padrao. Chats descobertos somente por mensagens recebidas ou
                        enviadas.
                      </span>
                    </span>
                  </label>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}

        {tab === 'relatorios' && settings ? (
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Agendamento automático</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.reportAutoEnabled}
                  onChange={(e) => void patchSettings({ reportAutoEnabled: e.target.checked })}
                />
                Gerar relatórios automaticamente todo dia
              </label>
              <label className="text-sm">
                Horário (HH:mm)
                <input
                  type="time"
                  className="ml-2 rounded-md border bg-background px-2 py-1"
                  value={settings.reportAutoTime}
                  onChange={(e) => void patchSettings({ reportAutoTime: e.target.value })}
                />
              </label>
            </CardContent>
          </Card>
        ) : null}

        {tab === 'logs' ? <SettingsLogsTab /> : null}
      </div>
    </div>
  )
}
