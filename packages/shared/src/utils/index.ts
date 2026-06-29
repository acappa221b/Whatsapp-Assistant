export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function ok<T>(value: T) {
  return { success: true as const, value }
}

export function err<E>(error: E) {
  return { success: false as const, error }
}

export * from './display-name'
export * from './chat-display-id'
export * from './agent-message-format'
export * from './agent-reply-guard'
export * from './normalize-for-compare'
export * from './chat-config-api'
export * from './message-preview'
export * from './image-fidelity-log'
export * from './rc07-log'
export * from './audio-fidelity-log'
export * from './chat-identity-resolver'
export * from './media-content-format'
export * from './sort-chat-permissions'
