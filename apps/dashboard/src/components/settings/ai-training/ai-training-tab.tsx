'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PERSONA_PRESETS, type PersonaPresetId } from '@finance-ai/shared/ai-training'

type PersonaState = {
  usageMode: 'personal' | 'business'
  presetId: string
  toneFormal: number
  responseLength: number
  useEmojis: boolean
  customInstructions: string
  exampleReplies: string[]
  behaviorFlags: Record<string, boolean>
  salesPlaybook: string
  learnFromHistory: boolean
  historySampleLimit: number
  historyPreview?: string[]
}

type KnowledgeRow = {
  id: string
  title: string
  type: string
  status: string
  errorMessage: string | null
}

type PreviewResult = {
  action: string
  replyText: string
  matchedDocuments: Array<{ id: string; title: string; score: number }>
}

const PRESET_OPTIONS: Array<{ value: PersonaPresetId; label: string }> = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Profissional' },
  { value: 'sales', label: 'Vendedor' },
  { value: 'support', label: 'Suporte' },
  { value: 'custom', label: 'Personalizado' },
]

const HISTORY_LIMITS = [10, 20, 50]

export function AiTrainingTab() {
  const [persona, setPersona] = useState<PersonaState | null>(null)
  const [docs, setDocs] = useState<KnowledgeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newExample, setNewExample] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [previewMessage, setPreviewMessage] = useState('Quanto custa o plano básico?')
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [personaRes, docsRes] = await Promise.all([
        fetch('/api/settings/ai/persona'),
        fetch('/api/settings/ai/knowledge'),
      ])
      if (personaRes.ok) {
        setPersona((await personaRes.json()) as PersonaState)
      }
      if (docsRes.ok) {
        const data = (await docsRes.json()) as { items: KnowledgeRow[] }
        setDocs(data.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function savePersona(patch: Partial<PersonaState>) {
    if (!persona) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/ai/persona', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        setPersona((await res.json()) as PersonaState)
      }
    } finally {
      setSaving(false)
    }
  }

  function applyPreset(presetId: PersonaPresetId) {
    if (presetId === 'custom' || !persona) {
      void savePersona({ presetId })
      return
    }
    const preset = PERSONA_PRESETS[presetId]
    void savePersona({
      presetId,
      toneFormal: preset.toneFormal,
      responseLength: preset.responseLength,
      useEmojis: preset.useEmojis,
      customInstructions: preset.customInstructions,
      behaviorFlags: preset.behaviorFlags,
      salesPlaybook: preset.salesPlaybook ?? persona.salesPlaybook,
    })
  }

  async function uploadFile(file: File) {
    const form = new FormData()
    form.append('file', file)
    if (uploadTitle.trim()) form.append('title', uploadTitle.trim())
    await fetch('/api/settings/ai/knowledge', { method: 'POST', body: form })
    setUploadTitle('')
    await load()
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/settings/ai/knowledge?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    await load()
  }

  async function runPreview() {
    setPreviewLoading(true)
    setPreviewResult(null)
    try {
      const res = await fetch('/api/settings/ai/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: previewMessage }),
      })
      if (res.ok) {
        setPreviewResult((await res.json()) as PreviewResult)
      }
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading && !persona) {
    return <p className="text-sm text-muted-foreground">Carregando treinamento IA…</p>
  }
  if (!persona) {
    return <p className="text-sm text-destructive">Não foi possível carregar a persona.</p>
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Modo de uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="usageMode"
                checked={persona.usageMode === 'personal'}
                onChange={() => void savePersona({ usageMode: 'personal' })}
              />
              Pessoal
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="usageMode"
                checked={persona.usageMode === 'business'}
                onChange={() => void savePersona({ usageMode: 'business' })}
              />
              Empresa
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Preset</span>
            <select
              className="w-full max-w-xs rounded-md border bg-background px-3 py-2"
              value={persona.presetId}
              onChange={(e) => applyPreset(e.target.value as PersonaPresetId)}
            >
              {PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Persona</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-muted-foreground">
              Formalidade ({persona.toneFormal})
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={persona.toneFormal}
              onChange={(e) =>
                setPersona((p) => (p ? { ...p, toneFormal: Number(e.target.value) } : p))
              }
              onMouseUp={() => void savePersona({ toneFormal: persona.toneFormal })}
              onTouchEnd={() => void savePersona({ toneFormal: persona.toneFormal })}
              className="w-full"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-muted-foreground">
              Tamanho da resposta ({persona.responseLength})
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={persona.responseLength}
              onChange={(e) =>
                setPersona((p) => (p ? { ...p, responseLength: Number(e.target.value) } : p))
              }
              onMouseUp={() => void savePersona({ responseLength: persona.responseLength })}
              onTouchEnd={() => void savePersona({ responseLength: persona.responseLength })}
              className="w-full"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={persona.useEmojis}
              onChange={(e) => void savePersona({ useEmojis: e.target.checked })}
            />
            Usar emojis
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-muted-foreground">Instruções personalizadas</span>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
              value={persona.customInstructions}
              onChange={(e) =>
                setPersona((p) => (p ? { ...p, customInstructions: e.target.value } : p))
              }
              onBlur={() => void savePersona({ customInstructions: persona.customInstructions })}
            />
          </label>
          <div className="md:col-span-2">
            <span className="mb-2 block text-sm text-muted-foreground">Exemplos de resposta</span>
            <ul className="mb-2 space-y-1 text-sm">
              {persona.exampleReplies.map((example, index) => (
                <li key={index} className="flex items-center justify-between gap-2 rounded border px-2 py-1">
                  <span>{example}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => {
                      const next = persona.exampleReplies.filter((_, i) => i !== index)
                      void savePersona({ exampleReplies: next })
                    }}
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Nova resposta exemplo"
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const text = newExample.trim()
                  if (!text) return
                  void savePersona({ exampleReplies: [...persona.exampleReplies, text] })
                  setNewExample('')
                }}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Comportamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(
            [
              ['proactiveOffers', 'Ofertas proativas'],
              ['useCatalog', 'Usar catálogo na resposta'],
              ['deferWhenUncertain', 'Pedir tempo quando não souber'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={persona.behaviorFlags[key] ?? false}
                onChange={(e) =>
                  void savePersona({
                    behaviorFlags: { ...persona.behaviorFlags, [key]: e.target.checked },
                  })
                }
              />
              {label}
            </label>
          ))}
          {persona.usageMode === 'business' ? (
            <label className="block">
              <span className="mb-1 block text-muted-foreground">Playbook de vendas</span>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
                value={persona.salesPlaybook}
                onChange={(e) =>
                  setPersona((p) => (p ? { ...p, salesPlaybook: e.target.value } : p))
                }
                onBlur={() => void savePersona({ salesPlaybook: persona.salesPlaybook })}
              />
            </label>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Aprendizado do histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={persona.learnFromHistory}
              onChange={(e) => void savePersona({ learnFromHistory: e.target.checked })}
            />
            Imitar minhas mensagens
          </label>
          <label className="block">
            <span className="mb-1 block text-muted-foreground">Amostras do histórico</span>
            <select
              className="rounded-md border bg-background px-3 py-2"
              value={persona.historySampleLimit}
              onChange={(e) =>
                void savePersona({ historySampleLimit: Number(e.target.value) })
              }
            >
              {HISTORY_LIMITS.map((n) => (
                <option key={n} value={n}>
                  {n} mensagens
                </option>
              ))}
            </select>
          </label>
          {persona.historyPreview?.length ? (
            <div>
              <span className="mb-1 block text-muted-foreground">Preview (3 amostras)</span>
              <ul className="space-y-1 rounded border p-2 text-xs text-muted-foreground">
                {persona.historyPreview.map((sample, i) => (
                  <li key={i}>{sample}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Base de conhecimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie planilhas de preços (.xlsx, .csv), textos (.txt) ou imagens (.png, .jpg).
            <a
              href="/templates/catalogo-precos.xlsx"
              className="ml-2 underline"
              download
            >
              Baixar modelo Excel
            </a>
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Título (opcional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void uploadFile(file)
                e.target.value = ''
              }}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Título</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-border/40">
                    <td className="py-2 pr-4">{doc.title}</td>
                    <td className="py-2 pr-4">{doc.type}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          doc.status === 'ready'
                            ? 'text-neon-green'
                            : doc.status === 'error'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        }
                      >
                        {doc.status}
                        {doc.errorMessage ? ` — ${doc.errorMessage}` : ''}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => void deleteDoc(doc.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!docs.length ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhum documento ainda.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Testar resposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-[240px] flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              value={previewMessage}
              onChange={(e) => setPreviewMessage(e.target.value)}
            />
            <Button type="button" onClick={() => void runPreview()} disabled={previewLoading || saving}>
              {previewLoading ? 'Simulando…' : 'Simular resposta'}
            </Button>
          </div>
          {previewResult ? (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p>
                <strong>Ação:</strong> {previewResult.action}
              </p>
              {previewResult.replyText ? (
                <p>
                  <strong>Resposta:</strong> {previewResult.replyText}
                </p>
              ) : null}
              {previewResult.matchedDocuments?.length ? (
                <p className="text-muted-foreground">
                  Docs:{' '}
                  {previewResult.matchedDocuments.map((d) => d.title).join(', ')}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
