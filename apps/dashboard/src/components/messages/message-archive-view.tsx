'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { resolveMessageDisplayContent, formatChatListLabel } from '@finance-ai/shared/utils'
import { shouldStickToBottom } from '@/lib/messages/message-scroll'
import { Button } from '@/components/ui/button'

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function isGroupChat(chatId: string): boolean {
  return chatId.endsWith('@g.us')
}

export function MessageArchiveView() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [messages, setMessages] = useState<ArchiveMessage[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [chatsError, setChatsError] = useState<string | null>(null)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [composerText, setComposerText] = useState('')
  const [sending, setSending] = useState(false)
  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const userSelectedChat = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  const onMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return
    stickToBottomRef.current = shouldStickToBottom(el)
  }, [])

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
        setChatsError(data.details ?? data.error ?? `Erro ao carregar chats (HTTP ${response.status})`)
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
        setMessagesError(data.details ?? data.error ?? `Erro ao carregar mensagens (HTTP ${response.status})`)
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
    void fetch('/api/whatsapp/status')
      .then((res) => res.json())
      .then((data: { connected?: boolean; status?: string }) => {
        setWhatsappConnected(Boolean(data.connected || data.status === 'connected'))
      })
      .catch(() => setWhatsappConnected(false))
  }, [])

  useEffect(() => {
    if (!userSelectedChat.current && !selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0]!.chatId)
    }
  }, [chats, selectedChatId])

  useEffect(() => {
    if (!selectedChatId) return
    stickToBottomRef.current = true
    void loadMessages(selectedChatId)
    const interval = setInterval(() => void loadMessages(selectedChatId), 5000)
    return () => clearInterval(interval)
  }, [selectedChatId, loadMessages])

  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollToBottom(messages.length > 0 ? 'smooth' : 'auto')
    }
  }, [messages, scrollToBottom])

  const selectedChat = chats.find((chat) => chat.chatId === selectedChatId)
  const isGroup = selectedChatId ? isGroupChat(selectedChatId) : false

  function handleSelectChat(chatId: string) {
    userSelectedChat.current = true
    setSelectedChatId(chatId)
    setMessagesError(null)
    stickToBottomRef.current = true
  }

  async function sendMessage() {
    const text = composerText.trim()
    if (!text || !selectedChatId || sending) return
    setSending(true)
    try {
      const response = await fetch(`/api/whatsapp/chats/${encodeURIComponent(selectedChatId)}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        setMessagesError(data.error ?? 'Falha ao enviar')
        return
      }
      setComposerText('')
      stickToBottomRef.current = true
      await loadMessages(selectedChatId)
      scrollToBottom('smooth')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-3 shrink-0">
        <h1 className="text-xl font-semibold neon-text-orange">Mensagens</h1>
        <p className="text-xs text-muted-foreground">Conversas habilitadas em Permissões</p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden rounded-xl border border-border/60 lg:grid-cols-[340px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-border/60 bg-card/40 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-border/60 px-4 py-3 text-sm font-medium text-neon-green">
            Chats
          </div>
          <div className="wa-scroll min-h-0 flex-1">
            {loadingChats && chats.length === 0 && !chatsError ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando chats...</p>
            ) : chatsError ? (
              <p className="p-4 text-sm text-destructive">Erro ao carregar chats: {chatsError}</p>
            ) : chats.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhum chat habilitado.</p>
            ) : (
              chats.map((chat) => {
                const active = chat.chatId === selectedChatId
                return (
                  <button
                    key={chat.chatId}
                    type="button"
                    onClick={() => handleSelectChat(chat.chatId)}
                    className={`flex w-full gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors ${
                      active ? 'bg-neon-orange/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {chat.displayNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">{displayChatName(chat)}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{chat.lastMessagePreview}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-card/20">
          <div className="shrink-0 border-b border-border/60 px-4 py-3">
            <h2 className="font-medium">
              {selectedChat ? displayChatName(selectedChat) : 'Conversa'}
            </h2>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={onMessagesScroll}
            className="wa-scroll min-h-0 flex-1 space-y-2 px-4 py-3"
          >
            {loadingMessages && messages.length === 0 && !messagesError ? (
              <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
            ) : messagesError ? (
              <p className="text-sm text-destructive">Erro ao carregar mensagens: {messagesError}</p>
            ) : !selectedChatId ? (
              <p className="text-sm text-muted-foreground">Selecione um chat à esquerda.</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem neste chat.</p>
            ) : (
              messages.map((message) => {
                const content = displayContent(message)
                const isMediaOnly =
                  message.messageType === 'AUDIO' || message.messageType === 'IMAGE'
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      data-sender-id={message.senderId}
                      className={`max-w-[78%] rounded-lg px-3 py-2 shadow-sm ${
                        message.fromMe
                          ? 'bg-[#005c4b] text-[#e9edef]'
                          : 'bg-muted/60 text-foreground'
                      }`}
                    >
                      {!message.fromMe && isGroup ? (
                        <div className="mb-0.5 text-[11px] font-medium text-neon-green">
                          {displaySenderName(message)}
                        </div>
                      ) : null}
                      {isMediaOnly && !content.trim() ? (
                        <span className="text-xs opacity-70">[{message.messageType}]</span>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
                      )}
                      <div className={`mt-1 text-[10px] ${message.fromMe ? 'text-[#8696a0]' : 'text-muted-foreground'}`}>
                        {formatTime(message.receivedAt)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} aria-hidden />
          </div>

          <div className="shrink-0 border-t border-border/60 bg-card/40 p-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                disabled={!selectedChatId || !whatsappConnected || sending}
                placeholder={
                  !whatsappConnected
                    ? 'WhatsApp desconectado — conecte em WhatsApp'
                    : 'Digite uma mensagem…'
                }
                className="max-h-24 min-h-[40px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="h-10 w-10 shrink-0 p-0"
                disabled={!selectedChatId || !whatsappConnected || sending || !composerText.trim()}
                onClick={() => void sendMessage()}
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
