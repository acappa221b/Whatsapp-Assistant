/** Formata texto de saída do agente (sem prefixo visível). */
export function formatAgentOutbound(innerText: string): string {
  return innerText.trim()
}

/** Mensagens antigas com prefixo debug RC-10. */
export function isLegacyAgentOutboundMessage(content: string): boolean {
  return content.trimStart().startsWith('Teste IA:')
}
