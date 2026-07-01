/** Evita tratar eco do agente (fromMe) como takeover humano. */
export class AgentOutboundTracker {
  private readonly pending = new Map<string, Set<string>>()
  private readonly known = new Map<string, Set<string>>()
  private readonly recentOrder = new Map<string, string[]>()

  register(chatId: string, content: string): void {
    const trimmed = content.trim()
    if (!trimmed) return
    for (const store of [this.pending, this.known]) {
      const set = store.get(chatId) ?? new Set()
      set.add(trimmed)
      store.set(chatId, set)
    }
    const order = this.recentOrder.get(chatId) ?? []
    order.push(trimmed)
    if (order.length > 20) order.splice(0, order.length - 20)
    this.recentOrder.set(chatId, order)
  }

  /** Eco imediato após envio — consome o registro pendente. */
  isAgentEcho(chatId: string, content: string): boolean {
    const set = this.pending.get(chatId)
    if (!set) return false
    const trimmed = content.trim()
    if (!set.has(trimmed)) return false
    set.delete(trimmed)
    if (set.size === 0) this.pending.delete(chatId)
    return true
  }

  /** Conteúdo enviado pelo agente nesta sessão (excluir de amostras de estilo). */
  isAgentContent(chatId: string, content: string): boolean {
    return this.known.get(chatId)?.has(content.trim()) ?? false
  }

  /** Últimas respostas do agente nesta sessão (mais recente por último). */
  getRecentReplies(chatId: string, limit = 10): string[] {
    const order = this.recentOrder.get(chatId) ?? []
    return order.slice(-limit)
  }

  unregister(chatId: string, content: string): void {
    const trimmed = content.trim()
    if (!trimmed) return
    for (const store of [this.pending, this.known]) {
      const set = store.get(chatId)
      if (!set) continue
      set.delete(trimmed)
      if (set.size === 0) store.delete(chatId)
    }
    const order = this.recentOrder.get(chatId)
    if (order) {
      const index = order.lastIndexOf(trimmed)
      if (index >= 0) order.splice(index, 1)
      if (order.length === 0) this.recentOrder.delete(chatId)
    }
  }
}
