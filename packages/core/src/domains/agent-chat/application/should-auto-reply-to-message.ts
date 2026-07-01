export type SkipDecision = { skip: true; reason: string } | { skip: false }

const GREETING_PATTERN =
  /^(oi|olá|ola|oie|e aí|e ai|eae|fala|bom dia|boa tarde|boa noite|hey|hello|hi|tudo bem|td bem|tudo bom|como vai|beleza\?)(?:[!?.…,\s]|$)/i

const ACK_ONLY_PATTERN =
  /^(boa+|blz|beleza|show|legal|massa|top|tmj|valeu|ok+|kk+|haha+|rs+|👍|🙏|✅)+[!.?\s]*$/iu

const STATUS_INCREMENTAL_INCOMING =
  /(ajuste fino|quase lá|quase la|finalizando|só mais|so mais|um momento|só um)/i

const ASSISTANT_ACK_PATTERNS =
  /(avisa quando|me fala quando|quando finalizar|quando terminar|já te aviso|ja te aviso)/i

const INCOMING_INVITE_PATTERNS = [
  /vamos marcar/i,
  /que tal/i,
  /pode ser às/i,
  /pode ser as/i,
  /amanhã às/i,
  /amanha as/i,
  /semana que vem/i,
  /\bbora\b/i,
]

export function isGreetingMessage(text: string): boolean {
  return GREETING_PATTERN.test(text.trim())
}

export function shouldDeferInviteBeforeLLM(incomingText: string): boolean {
  const trimmed = incomingText.trim()
  if (!trimmed) return false
  return INCOMING_INVITE_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function shouldSkipBeforeLLM(
  incomingText: string,
  recentContext: Array<{ role: 'user' | 'assistant'; content: string }>,
): SkipDecision {
  const trimmed = incomingText.trim()
  if (!trimmed) return { skip: true, reason: 'empty' }

  if (isGreetingMessage(trimmed)) {
    return { skip: false }
  }

  const normalized = trimmed.toLowerCase()
  const isMultiWordConversation = trimmed.includes(' ') && trimmed.length > 6

  if (ACK_ONLY_PATTERN.test(normalized) && !isMultiWordConversation) {
    return { skip: true, reason: 'ack-only' }
  }

  const lastAssistant = [...recentContext].reverse().find((entry) => entry.role === 'assistant')
  if (lastAssistant && ASSISTANT_ACK_PATTERNS.test(lastAssistant.content)) {
    if (STATUS_INCREMENTAL_INCOMING.test(trimmed)) {
      return { skip: true, reason: 'status-after-ack' }
    }
  }

  if (lastAssistant && ACK_ONLY_PATTERN.test(normalized) && !isMultiWordConversation) {
    return { skip: true, reason: 'ack-after-assistant' }
  }

  return { skip: false }
}
