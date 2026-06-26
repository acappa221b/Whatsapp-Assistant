export type BaileysMessagePayload = Record<string, unknown> & {
  message?: BaileysMessagePayload
}

type MessageWrapper = { message?: BaileysMessagePayload }

/** Known Baileys wrapper keys — order matters for deterministic peeling. */
export const BAILEYS_WRAPPER_KEYS = [
  'ephemeralMessage',
  'viewOnceMessage',
  'viewOnceMessageV2',
  'viewOnceMessageV2Extension',
  'documentWithCaptionMessage',
  'editedMessage',
  'deviceSentMessage',
  'futureProofMessage',
  'albumMessage',
] as const

export type BaileysWrapperKey = (typeof BAILEYS_WRAPPER_KEYS)[number]

export type UnwrapBaileysResult = {
  message: BaileysMessagePayload | undefined
  wrappers: BaileysWrapperKey[]
  depth: number
}

const DEFAULT_MAX_DEPTH = 12

function pickWrapper(message: BaileysMessagePayload): { key: BaileysWrapperKey; inner: MessageWrapper } | null {
  for (const key of BAILEYS_WRAPPER_KEYS) {
    const wrapper = message[key] as MessageWrapper | undefined
    if (wrapper?.message) return { key, inner: wrapper }
  }
  return null
}

/**
 * Recursively unwraps Baileys message wrappers until the inner payload is reached.
 * RC-07 — single entry point for wrapper navigation.
 */
export function unwrapBaileysMessage(
  message?: BaileysMessagePayload,
  maxDepth: number = DEFAULT_MAX_DEPTH,
): UnwrapBaileysResult {
  if (!message) return { message: undefined, wrappers: [], depth: 0 }

  const wrappers: BaileysWrapperKey[] = []
  let current: BaileysMessagePayload = message

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const next = pickWrapper(current)
    if (!next?.inner.message) break
    wrappers.push(next.key)
    current = next.inner.message
  }

  return { message: current, wrappers, depth: wrappers.length }
}

/** @deprecated Use unwrapBaileysMessage — kept for backward compatibility. */
export function unwrapMessageContent(message?: BaileysMessagePayload): BaileysMessagePayload | undefined {
  return unwrapBaileysMessage(message).message
}
