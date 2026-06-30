'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatChatListLabel } from '@finance-ai/shared/utils'
import { Button } from '@/components/ui/button'

type ChatSummary = {
  chatId: string
  displayNumber: number
  displayLabel: string
  chatName: string
}

export function MultiMessageView() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [resultSummary, setResultSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [whatsappConnected, setWhatsappConnected] = useState(false)

  const loadChats = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/archive/chats')
      const data = (await response.json()) as { items?: ChatSummary[]; error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Erro ao carregar chats')
        return
      }
      setError(null)
      setChats(data.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadChats()
    void fetch('/api/whatsapp/status')
      .then((res) => res.json())
      .then((data: { connected?: boolean; status?: string }) => {
        setWhatsappConnected(Boolean(data.connected || data.status === 'connected'))
      })
      .catch(() => setWhatsappConnected(false))
  }, [loadChats])

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return chats
    return chats.filter((chat) => {
      const label = formatChatListLabel(chat.displayNumber, chat.chatName).toLowerCase()
      return label.includes(query) || chat.chatId.toLowerCase().includes(query)
    })
  }, [chats, search])

  const selectedCount = selected.size

  function toggleChat(chatId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(chatId)) next.delete(chatId)
      else next.add(chatId)
      return next
    })
  }

  function selectAllVisible() {
    setSelected(new Set(filteredChats.map((chat) => chat.chatId)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function sendBroadcast() {
    const text = content.trim()
    if (!text || selectedCount === 0 || sending) return
    if (!whatsappConnected) {
      setError('WhatsApp desconectado — conecte em Configurações → WhatsApp')
      return
    }
    if (!window.confirm(`Enviar para ${selectedCount} contato(s)?`)) return

    setSending(true)
    setError(null)
    setResultSummary(null)
    setProgress({ current: 0, total: selectedCount })

    try {
      const response = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatIds: [...selected], content: text }),
      })
      const data = (await response.json()) as {
        sent?: number
        failed?: Array<{ chatId: string; error: string }>
        error?: string
      }
      if (!response.ok) {
        setError(data.error ?? 'Falha no envio')
        return
      }
      const sent = data.sent ?? 0
      const failed = data.failed ?? []
      setProgress({ current: sent, total: selectedCount })
      if (failed.length === 0) {
        setResultSummary(`Enviado para ${sent} de ${selectedCount} chats.`)
      } else {
        const failures = failed.map((entry) => `${entry.chatId}: ${entry.error}`).join('; ')
        setResultSummary(`Enviado para ${sent} de ${selectedCount}. Falhas: ${failures}`)
      }
      setContent('')
      setSelected(new Set())
      await loadChats()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Erro de rede')
    } finally {
      setSending(false)
      setProgress(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-4 shrink-0">
        <h1 className="text-xl font-semibold neon-text-green">Multi Mensagem</h1>
        <p className="text-xs text-muted-foreground">
          Envie a mesma mensagem para vários chats habilitados
        </p>
      </header>

      {error ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {resultSummary ? (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          {resultSummary}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className="flex min-h-0 flex-col rounded-xl border border-border/60 bg-card/40">
          <div className="space-y-2 border-b border-border/60 p-3">
            <input
              type="search"
              placeholder="Buscar por nome ou número…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={selectAllVisible}>
                Selecionar todos
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={clearSelection}>
                Limpar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{selectedCount} selecionado(s)</p>
          </div>
          <div className="wa-scroll min-h-0 flex-1">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando chats…</p>
            ) : filteredChats.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhum chat habilitado.</p>
            ) : (
              filteredChats.map((chat) => (
                <label
                  key={chat.chatId}
                  className="flex cursor-pointer items-center gap-3 border-b border-border/40 px-4 py-3 hover:bg-muted/30"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(chat.chatId)}
                    onChange={() => toggleChat(chat.chatId)}
                  />
                  <span className="truncate text-sm">
                    {formatChatListLabel(chat.displayNumber, chat.chatName)}
                  </span>
                </label>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-xl border border-border/60 bg-card/20 p-4">
          <textarea
            rows={8}
            disabled={!whatsappConnected || sending}
            placeholder={
              !whatsappConnected
                ? 'WhatsApp desconectado — conecte em Configurações → WhatsApp'
                : 'Digite a mensagem para enviar…'
            }
            className="min-h-[160px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={!whatsappConnected || sending || selectedCount === 0 || !content.trim()}
              onClick={() => void sendBroadcast()}
            >
              {sending ? 'Enviando…' : `Enviar para ${selectedCount} chat(s)`}
            </Button>
            {progress ? (
              <p className="text-sm text-muted-foreground">
                Progresso: {progress.current}/{progress.total}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
