export const DEFAULT_AGENT_DEFER_PHRASE =
  'Opa, me dá um minutinho que tô terminando um negócio aqui e já te falo'

const INVITE_PATTERNS = [
  /vamos (marcar|combinar|nos ver)/i,
  /que tal (às|as)/i,
  /pode ser (às|as|amanhã)/i,
  /te chamo (mais tarde|depois)/i,
  /(combinado|fechado|tô dentro|to dentro|pode ser sim)/i,
  /amanhã (às|as)/i,
  /semana que vem/i,
  /bora (no|na|às|as)/i,
]

export function containsInviteOrAcceptance(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  return INVITE_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function sanitizeAgentReply(
  text: string,
): { ok: true; text: string } | { ok: false; forceDefer: true; phrase: string } {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, forceDefer: true, phrase: DEFAULT_AGENT_DEFER_PHRASE }
  }
  if (containsInviteOrAcceptance(trimmed)) {
    return { ok: false, forceDefer: true, phrase: DEFAULT_AGENT_DEFER_PHRASE }
  }
  return { ok: true, text: trimmed }
}
