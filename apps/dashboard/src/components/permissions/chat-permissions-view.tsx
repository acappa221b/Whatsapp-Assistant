'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Trash2, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import {
  cycleSortState,
  filterChatsBySearch,
  formatChatListLabel,
  getChatTypeLabel,
  sortChats,
  type SortColumn,
  type SortState,
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

function ariaSortValue(direction: SortState['direction']): 'ascending' | 'descending' | 'none' {
  if (direction === 'asc') return 'ascending'
  if (direction === 'desc') return 'descending'
  return 'none'
}

function SortableHeader({
  label,
  column,
  sort,
  isBoolean,
  onSort,
}: {
  label: string
  column: SortColumn
  sort: SortState
  isBoolean: boolean
  onSort: (column: SortColumn, isBoolean: boolean) => void
}) {
  const active = sort.column === column
  const Icon = !active || !sort.direction ? Minus : sort.direction === 'asc' ? ChevronUp : ChevronDown
  return (
    <th
      className="cursor-pointer px-4 py-3 hover:bg-muted/60"
      aria-sort={active ? ariaSortValue(sort.direction) : 'none'}
      onClick={() => onSort(column, isBoolean)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
      </span>
    </th>
  )
}

export function ChatPermissionsView() {
  const [chats, setChats] = useState<ChatPermissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [updatingChatId, setUpdatingChatId] = useState<string | null>(null)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [resolvingNames, setResolvingNames] = useState(false)
  const [sort, setSort] = useState<SortState>({ column: null, direction: null })
  const [search, setSearch] = useState('')

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

  const visibleChats = useMemo(
    () => sortChats(filterChatsBySearch(chats, search), sort),
    [chats, search, sort],
  )

  function handleSort(column: SortColumn, isBoolean: boolean) {
    setSort((current) => cycleSortState(current, column, isBoolean))
  }

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

      <input
        className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm"
        placeholder="Buscar por #N ou nome…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
                <SortableHeader label="Chat/Grupo" column="name" sort={sort} isBoolean={false} onSort={handleSort} />
                <SortableHeader label="Habilitado" column="archiveEnabled" sort={sort} isBoolean onSort={handleSort} />
                <SortableHeader label="Resposta IA" column="agentChatEnabled" sort={sort} isBoolean onSort={handleSort} />
                <SortableHeader label="Áudio" column="audioProcessingEnabled" sort={sort} isBoolean onSort={handleSort} />
                <SortableHeader label="Foto" column="photoProcessingEnabled" sort={sort} isBoolean onSort={handleSort} />
                <SortableHeader label="Relatório" column="reportGenerationEnabled" sort={sort} isBoolean onSort={handleSort} />
                <th className="px-4 py-3">Histórico</th>
              </tr>
            </thead>
            <tbody>
              {visibleChats.map((chat) => {
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
              {visibleChats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {search.trim() ? 'Nenhum chat corresponde à busca.' : 'Nenhum chat reconhecido ainda. Envie uma mensagem no WhatsApp conectado.'}
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
