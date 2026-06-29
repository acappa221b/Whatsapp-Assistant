'use client'

import { useEffect, useState } from 'react'
import { formatChatListLabel } from '@finance-ai/shared/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  meta?: 'sent' | 'query' | 'preview'
}

type PreviewState = {
  actionToken: string
  text: string
  targets: Array<{ displayNumber: number; name: string | null; chatId: string }>
  warnings: string[]
  needsExtraConfirm: boolean
  assistantMessage: string
}

type ActionLogRow = {
  id: string
  action: string
  message: string
  createdAt: string
  chatIds: string[]
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [extraConfirm, setExtraConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentActions, setRecentActions] = useState<ActionLogRow[]>([])

  useEffect(() => {
    void fetch('/api/assistant/actions')
      .then((res) => res.json())
      .then((data: { items: ActionLogRow[] }) => setRecentActions(data.items ?? []))
      .catch(() => undefined)
  }, [])

  async function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = (await res.json()) as {
        phase: string
        text?: string
        message?: string
        actionToken?: string
        preview?: PreviewState['targets'] extends infer _T
          ? {
              text: string
              targets: PreviewState['targets']
              warnings: string[]
              needsExtraConfirm: boolean
            }
          : never
        assistantMessage?: string
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message ?? data.text ?? `Erro HTTP ${res.status}`,
            meta: 'query',
          },
        ])
        return
      }

      if (data.phase === 'error') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message ?? 'Não foi possível processar.', meta: 'query' },
        ])
        return
      }

      if (data.phase === 'preview' && data.actionToken && data.preview) {
        setPreview({
          actionToken: data.actionToken,
          text: data.preview.text,
          targets: data.preview.targets,
          warnings: data.preview.warnings,
          needsExtraConfirm: data.preview.needsExtraConfirm,
          assistantMessage: data.assistantMessage ?? '',
        })
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.assistantMessage ?? 'Confirme o envio.', meta: 'preview' },
        ])
        return
      }

      if (data.phase === 'answer') {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text ?? '', meta: 'query' }])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message ?? data.text ?? 'Não foi possível processar.', meta: 'query' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function confirmSend() {
    if (!preview) return
    setLoading(true)
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: preview.assistantMessage,
          confirmAction: true,
          actionToken: preview.actionToken,
          previewText: preview.text,
          extraConfirm: preview.needsExtraConfirm ? extraConfirm : undefined,
        }),
      })
      const data = (await res.json()) as {
        phase: string
        sent?: number
        message?: string
        text?: string
      }

      if (data.phase === 'done') {
        setPreview(null)
        setExtraConfirm('')
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Enviado para ${data.sent ?? 0} chat(s).`, meta: 'sent' },
        ])
        const actionsRes = await fetch('/api/assistant/actions')
        const actionsData = (await actionsRes.json()) as { items: ActionLogRow[] }
        setRecentActions(actionsData.items ?? [])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message ?? data.text ?? 'Falha ao enviar.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat IA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte histórico e relatórios ou execute envios com confirmação.
          </p>
        </div>

        <Card className="flex flex-1 flex-col border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Conversa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-md border p-4">
              {messages.length === 0 ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Exemplos:</p>
                  <ul className="list-inside list-disc">
                    <li>O que a Maiara falou essa semana?</li>
                    <li>Envia um Oi para a Maiara</li>
                    <li>Manda convite do meu aniversário para todos habilitados</li>
                  </ul>
                </div>
              ) : null}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user' ? 'ml-auto bg-neon-pink/20' : 'bg-muted/40'
                  }`}
                >
                  {msg.meta === 'sent' ? (
                    <span className="mb-1 block text-[10px] uppercase tracking-wide text-green-600">
                      Enviado
                    </span>
                  ) : null}
                  {msg.content}
                </div>
              ))}
            </div>

            {preview ? (
              <Card className="border-neon-orange/40 bg-muted/20">
                <CardContent className="space-y-3 pt-4">
                  <p className="text-sm font-medium">Preview do envio</p>
                  <textarea
                    className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={preview.text}
                    onChange={(e) => setPreview((p) => (p ? { ...p, text: e.target.value } : p))}
                  />
                  <ul className="text-xs text-muted-foreground">
                    {preview.targets.map((t) => (
                      <li key={t.chatId}>{formatChatListLabel(t.displayNumber, t.name)}</li>
                    ))}
                  </ul>
                  {preview.warnings.map((warning) => (
                    <p key={warning} className="text-xs text-amber-600">
                      {warning}
                    </p>
                  ))}
                  {preview.needsExtraConfirm ? (
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder='Digite CONFIRMAR para mais de 20 chats'
                      value={extraConfirm}
                      onChange={(e) => setExtraConfirm(e.target.value)}
                    />
                  ) : null}
                  <div className="flex gap-2">
                    <Button type="button" disabled={loading} onClick={() => void confirmSend()}>
                      Confirmar envio
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setPreview(null)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Sua mensagem…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <Button type="button" disabled={loading} onClick={() => void send()}>
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full shrink-0 border-border/60 bg-card/60 lg:w-72">
        <CardHeader>
          <CardTitle className="text-base">Ações recentes</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[420px] space-y-2 overflow-y-auto text-xs">
          {recentActions.length === 0 ? (
            <p className="text-muted-foreground">Nenhum envio registrado ainda.</p>
          ) : (
            recentActions.map((action) => (
              <div key={action.id} className="rounded-md border p-2">
                <div className="font-medium">{action.action}</div>
                <div className="text-muted-foreground">
                  {new Date(action.createdAt).toLocaleString('pt-BR')}
                </div>
                <div className="mt-1 line-clamp-2">{action.message}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
