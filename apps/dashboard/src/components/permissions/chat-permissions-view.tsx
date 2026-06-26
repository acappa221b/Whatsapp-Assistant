'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import {
  formatChatListLabel,
  getChatTypeLabel,
} from '@finance-ai/shared/utils'
import { ToggleSwitch } from '@/components/ui/toggle-switch'

export type ChatPermissionRow = {
  chatId: string
  displayNumber: number
  displayLabel: string
  name: string | null
  storageDir?: string | null
  nameResolved?: boolean
  archiveEnabled: boolean
  agentChatEnabled: boolean
  photoProcessingEnabled: boolean
  audioProcessingEnabled: boolean
  reportGenerationEnabled: boolean
  agentPaused?: boolean
  updatedAt: string
}

export function ChatPermissionsView() {
  const [chats, setChats] = useState<ChatPermissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [updatingChatId, setUpdatingChatId] = useState<string | null>(null)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [resolvingNames, setResolvingNames] = useState(false)

  const loadChats = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/whatsapp/chats')
      if (!response.ok) {
        setError('Falha ao carregar chats')
        setLoading(false)
        return
      }
      const data = (await response.json()) as { items: ChatPermissionRow[] }
      setChats(data.items ?? [])
    } catch {
      setError('Erro de rede ao carregar chats')
    } finally {
      setLoading(false)
    }
  }, [])

  const resolveNames = useCallback(async (chatIds?: string[]) => {
    setResolvingNames(true)
    try {
      const response = await fetch('/api/whatsapp/chats/resolve-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatIds ? { chatIds } : {}),
      })
      if (!response.ok) {
        setError('Falha ao atualizar nomes')
        return
      }
      await loadChats()
    } finally {
      setResolvingNames(false)
    }
  }, [loadChats])

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      setLoading(true)
      await resolveNames()
      if (!cancelled) await loadChats()
    }
    void boot()
    const interval = setInterval(() => void loadChats(), 8000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [loadChats, resolveNames])

  useEffect(() => {
    if (!resolvingNames && chats.some((chat) => !chat.nameResolved)) {
      const timeout = setTimeout(() => void resolveNames(), 5000)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [chats, resolveNames, resolvingNames])

  async function patchChat(
    chatId: string,
    patch: Partial<
      Pick<
        ChatPermissionRow,
        | 'archiveEnabled'
        | 'agentChatEnabled'
        | 'photoProcessingEnabled'
        | 'audioProcessingEnabled'
        | 'reportGenerationEnabled'
      >
    >,
  ) {
    setUpdatingChatId(chatId)
    try {
      const response = await fetch(`/api/whatsapp/chats/${encodeURIComponent(chatId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!response.ok) return
      const updated = (await response.json()) as ChatPermissionRow
      setChats((current) =>
        current.map((chat) => (chat.chatId === updated.chatId ? updated : chat)),
      )
    } finally {
      setUpdatingChatId(null)
    }
  }

  async function deleteHistory(chatId: string, displayName: string) {
    const confirmed = window.confirm(
      `Apagar todo o histórico de "${displayName}"? Esta ação não pode ser desfeita.`,
    )
    if (!confirmed) return

    setDeletingChatId(chatId)
    setFeedback(null)
    try {
      const response = await fetch(
        `/api/whatsapp/chats/${encodeURIComponent(chatId)}/history`,
        { method: 'DELETE' },
      )
      if (!response.ok) {
        setError('Falha ao apagar histórico')
        return
      }
      const data = (await response.json()) as ChatPermissionRow & {
        deletedMessages?: number
        deletedMediaFiles?: number
      }
      setFeedback(
        `Histórico e arquivos apagados (${data.deletedMessages ?? 0} mensagens, ${data.deletedMediaFiles ?? 0} arquivos)`,
      )
      setChats((current) =>
        current.map((chat) =>
          chat.chatId === data.chatId
            ? {
                ...chat,
                name: data.name,
                archiveEnabled: data.archiveEnabled,
                agentChatEnabled: data.agentChatEnabled,
                photoProcessingEnabled: data.photoProcessingEnabled,
                audioProcessingEnabled: data.audioProcessingEnabled,
                reportGenerationEnabled: data.reportGenerationEnabled,
                updatedAt: data.updatedAt,
              }
            : chat,
        ),
      )
    } finally {
      setDeletingChatId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Permissões</h1>
          <p className="text-sm text-muted-foreground">
            Controle quais conversas aparecem em Mensagens, resposta IA, processamento de mídia e
            relatórios diários.
          </p>
        </div>
        <button
          type="button"
          disabled={resolvingNames}
          onClick={() => void resolveNames()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${resolvingNames ? 'animate-spin' : ''}`} />
          Atualizar nomes
        </button>
      </div>

      {feedback ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading && chats.length === 0 ? (
        <p className="text-sm">Carregando e resolvendo nomes…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Chat/Grupo</th>
                <th className="px-4 py-3">Habilitado</th>
                <th className="px-4 py-3">Resposta IA</th>
                <th className="px-4 py-3">Áudio</th>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Relatório</th>
                <th className="px-4 py-3">Histórico</th>
              </tr>
            </thead>
            <tbody>
              {chats.map((chat) => {
                const label = formatChatListLabel(chat.displayNumber, chat.name)
                const typeLabel = getChatTypeLabel(chat.chatId)
                const busy = updatingChatId === chat.chatId || deletingChatId === chat.chatId
                const featureDisabled = !chat.archiveEnabled || busy
                return (
                  <tr key={chat.chatId} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {!chat.nameResolved && chat.name?.trim() ? (
                          <span className="text-amber-600">⚠️ {label}</span>
                        ) : (
                          label
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{typeLabel}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={chat.archiveEnabled}
                        disabled={busy}
                        label={`Habilitar ${label} em Mensagens`}
                        onChange={(next) => void patchChat(chat.chatId, { archiveEnabled: next })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={chat.agentChatEnabled}
                        disabled={featureDisabled}
                        label={`Resposta IA para ${label}`}
                        onChange={(next) =>
                          void patchChat(chat.chatId, { agentChatEnabled: next })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={chat.audioProcessingEnabled}
                        disabled={featureDisabled}
                        label={`Áudio para ${label}`}
                        onChange={(next) =>
                          void patchChat(chat.chatId, { audioProcessingEnabled: next })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={chat.photoProcessingEnabled}
                        disabled={featureDisabled}
                        label={`Foto para ${label}`}
                        onChange={(next) =>
                          void patchChat(chat.chatId, { photoProcessingEnabled: next })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={chat.reportGenerationEnabled}
                        disabled={featureDisabled}
                        label={`Relatório para ${label}`}
                        onChange={(next) =>
                          void patchChat(chat.chatId, { reportGenerationEnabled: next })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label="Apagar histórico"
                        disabled={busy}
                        onClick={() => void deleteHistory(chat.chatId, label)}
                        className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {chats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum chat reconhecido ainda. Envie uma mensagem no WhatsApp conectado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
