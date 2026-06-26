'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveMessageDisplayContent, formatChatListLabel } from '@finance-ai/shared/utils'

type ChatSummary = {
  chatId: string
  displayNumber: number
  displayLabel: string
  chatName: string
  messageCount: number
  lastMessageAt: string
  lastMessagePreview: string
  lastMessageType: string
}

type ArchiveMessage = {
  id: string
  chatId: string
  chatName: string | null
  sender: string
  senderId: string
  senderName: string
  content: string
  messageType: string
  receivedAt: string
  fromMe: boolean
}

function displayChatName(chat: ChatSummary): string {
  return formatChatListLabel(chat.displayNumber, chat.chatName)
}

function displaySenderName(message: ArchiveMessage): string {
  return message.senderName?.trim() || 'Contato'
}

function displayContent(message: ArchiveMessage): string {
  return resolveMessageDisplayContent(message.content, message.messageType)
}

export function MessageArchiveView() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [messages, setMessages] = useState<ArchiveMessage[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [chatsError, setChatsError] = useState<string | null>(null)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const userSelectedChat = useRef(false)

  const loadChats = useCallback(async () => {
    setLoadingChats(true)
    try {
      const response = await fetch('/api/whatsapp/archive/chats')
      const data = (await response.json()) as {
        items?: ChatSummary[]
        error?: string
        details?: string
      }
      if (!response.ok) {
        setChatsError(data.details ?? data.error ?? `HTTP ${response.status}`)
        return
      }
      setChatsError(null)
      setChats(data.items ?? [])
    } catch (error) {
      setChatsError(error instanceof Error ? error.message : 'Erro de rede')
    } finally {
      setLoadingChats(false)
    }
  }, [])

  const loadMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(
        `/api/whatsapp/messages?chatId=${encodeURIComponent(chatId)}&limit=200`,
      )
      const data = (await response.json()) as {
        items?: ArchiveMessage[]
        error?: string
        details?: string
      }
      if (!response.ok) {
        setMessagesError(data.details ?? data.error ?? `HTTP ${response.status}`)
        return
      }
      setMessagesError(null)
      const sorted = [...(data.items ?? [])].sort(
        (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
      )
      setMessages(sorted)
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Erro de rede')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    void loadChats()
    const interval = setInterval(() => void loadChats(), 8000)
    return () => clearInterval(interval)
  }, [loadChats])

  useEffect(() => {
    if (!userSelectedChat.current && !selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0]!.chatId)
    }
  }, [chats, selectedChatId])

  useEffect(() => {
    if (!selectedChatId) return
    void loadMessages(selectedChatId)
    const interval = setInterval(() => void loadMessages(selectedChatId), 5000)
    return () => clearInterval(interval)
  }, [selectedChatId, loadMessages])

  const selectedChat = chats.find((chat) => chat.chatId === selectedChatId)

  function handleSelectChat(chatId: string) {
    userSelectedChat.current = true
    setSelectedChatId(chatId)
    setMessagesError(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold neon-text-orange">Mensagens</h1>
        <p className="text-sm text-muted-foreground">Arquivo completo de conversas WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr] min-h-[560px]">
        <aside className="rounded-xl border border-border/60 bg-card/40 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/60 text-sm font-medium text-neon-green">
            Chats
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingChats && chats.length === 0 && !chatsError ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando chats...</p>
            ) : chatsError ? (
              <p className="p-4 text-sm text-destructive">Erro ao carregar chats: {chatsError}</p>
            ) : chats.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhum chat ainda.</p>
            ) : (
              chats.map((chat) => {
                const active = chat.chatId === selectedChatId
                return (
                  <button
                    key={chat.chatId}
                    type="button"
                    onClick={() => handleSelectChat(chat.chatId)}
                    className={`w-full text-left px-4 py-3 border-b border-border/40 transition-colors ${
                      active ? 'bg-neon-orange/10 border-l-2 border-l-neon-orange' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="font-medium truncate">{displayChatName(chat)}</div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {chat.lastMessagePreview}
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                      <span>{chat.messageCount} msgs</span>
                      <span>{new Date(chat.lastMessageAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="rounded-xl border border-border/60 bg-card/30 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60">
            <h2 className="font-medium">
              {selectedChat ? displayChatName(selectedChat) : 'Conversa'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages && messages.length === 0 && !messagesError ? (
              <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
            ) : messagesError ? (
              <p className="text-sm text-destructive">Erro ao carregar mensagens: {messagesError}</p>
            ) : !selectedChatId ? (
              <p className="text-sm text-muted-foreground">Selecione um chat.</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem neste chat.</p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-1"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium">{displaySenderName(message)}</div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(message.receivedAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="inline-flex text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-neon-green/10 text-neon-green">
                    {message.messageType}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words pt-1">
                    {displayContent(message)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
