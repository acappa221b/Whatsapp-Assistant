import { formatChatListLabel } from '@finance-ai/shared/utils'
import type { AssistantTarget, ResolvedTarget } from '../domain/assistant-command.types'

export type ChatConfigForResolve = {
  chatId: string
  displayNumber: number
  name: string | null
  archiveEnabled: boolean
  agentChatEnabled: boolean
}

export type ResolveTargetsResult =
  | { ok: true; targets: ResolvedTarget[]; warnings: string[] }
  | { ok: false; clarify: string }

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function tokenize(value: string): string[] {
  return normalize(value).split(/\s+/).filter(Boolean)
}

function scoreName(query: string, name: string | null, displayNumber: number): number {
  const q = normalize(query)
  if (!q) return 0
  const label = normalize(formatChatListLabel(displayNumber, name))
  const chatName = normalize(name ?? '')
  if (!chatName && !label) return 0
  if (chatName === q || label === q) return 1
  if (chatName.includes(q) || q.includes(chatName)) return 0.85
  const qTokens = tokenize(q)
  const nameTokens = tokenize(chatName)
  if (!nameTokens.length) return 0
  const overlap = qTokens.filter((token) => nameTokens.some((nt) => nt.includes(token) || token.includes(nt)))
  return overlap.length / Math.max(qTokens.length, 1)
}

export class ResolveAssistantTargetsUseCase {
  constructor(private readonly chats: ChatConfigForResolve[]) {}

  execute(targets: AssistantTarget[]): ResolveTargetsResult {
    const warnings: string[] = []
    const resolved = new Map<string, ResolvedTarget>()

    for (const target of targets) {
      if (target.type === 'all_archive_enabled') {
        for (const chat of this.chats.filter((c) => c.archiveEnabled)) {
          resolved.set(chat.chatId, this.toResolved(chat))
        }
        continue
      }

      if (target.type === 'all_agent_enabled') {
        for (const chat of this.chats.filter((c) => c.archiveEnabled && c.agentChatEnabled)) {
          resolved.set(chat.chatId, this.toResolved(chat))
        }
        continue
      }

      if (target.type === 'chat_ids') {
        for (const chatId of target.chatIds) {
          const chat = this.chats.find((c) => c.chatId === chatId)
          if (!chat) {
            return { ok: false, clarify: `Chat ${chatId} não está cadastrado no sistema.` }
          }
          if (!chat.archiveEnabled) {
            warnings.push(`${formatChatListLabel(chat.displayNumber, chat.name)} não está habilitado em Permissões.`)
            continue
          }
          resolved.set(chat.chatId, this.toResolved(chat))
        }
        continue
      }

      for (const query of target.nameQueries) {
        const scored = this.chats
          .map((chat) => ({ chat, score: scoreName(query, chat.name, chat.displayNumber) }))
          .filter((entry) => entry.score >= 0.7)
          .sort((a, b) => b.score - a.score)

        if (scored.length === 0) {
          return { ok: false, clarify: `Não encontrei ninguém com nome parecido com "${query}".` }
        }
        if (scored.length > 1 && scored[0]!.score - scored[1]!.score < 0.15) {
          const options = scored
            .slice(0, 3)
            .map((entry) => formatChatListLabel(entry.chat.displayNumber, entry.chat.name))
            .join(', ')
          return {
            ok: false,
            clarify: `Encontrei mais de um contato para "${query}": ${options}. Qual deles?`,
          }
        }

        const chat = scored[0]!.chat
        if (!chat.archiveEnabled) {
          return {
            ok: false,
            clarify: `${formatChatListLabel(chat.displayNumber, chat.name)} não está habilitado em Permissões. Habilite antes de enviar.`,
          }
        }
        resolved.set(chat.chatId, this.toResolved(chat))
      }
    }

    if (resolved.size === 0) {
      return { ok: false, clarify: 'Nenhum destinatário válido encontrado.' }
    }

    return { ok: true, targets: [...resolved.values()], warnings }
  }

  private toResolved(chat: ChatConfigForResolve): ResolvedTarget {
    return {
      chatId: chat.chatId,
      displayNumber: chat.displayNumber,
      name: chat.name,
      archiveEnabled: chat.archiveEnabled,
    }
  }
}
