import {
  createEmptyMetrics,
  type MessageCaptureMetrics,
} from '@finance-ai/core/domains/message-archive'

const globalForCapture = globalThis as unknown as {
  whatsappCaptureMetrics?: MessageCaptureMetrics
}

export function getMessageCaptureMetrics(): MessageCaptureMetrics {
  if (!globalForCapture.whatsappCaptureMetrics) {
    globalForCapture.whatsappCaptureMetrics = createEmptyMetrics()
  }
  return globalForCapture.whatsappCaptureMetrics
}

export function recordMessageReceived(messageType: string): void {
  const metrics = getMessageCaptureMetrics()
  metrics.totalReceived += 1
  if (messageType in metrics.types) {
    metrics.types[messageType as keyof typeof metrics.types] += 1
  }
  if (messageType === 'UNKNOWN') {
    metrics.unknownTypes.unknown = (metrics.unknownTypes.unknown ?? 0) + 1
  }
}

export function recordMessageMapped(wrappers: string[] = []): void {
  const metrics = getMessageCaptureMetrics()
  metrics.totalMapped += 1
  for (const wrapper of wrappers) {
    metrics.wrappersEncountered[wrapper] = (metrics.wrappersEncountered[wrapper] ?? 0) + 1
  }
}

export function recordUnknownPayloadKeys(keys: string[]): void {
  const hint = keys.filter((k) => !k.startsWith('_')).join(',') || 'empty'
  const metrics = getMessageCaptureMetrics()
  metrics.unknownTypes[hint] = (metrics.unknownTypes[hint] ?? 0) + 1
}

export function recordMessagePersisted(): void {
  getMessageCaptureMetrics().totalPersisted += 1
}

export function recordMessagePersistFailed(): void {
  getMessageCaptureMetrics().totalFailed += 1
}

export function recordMessageIgnored(reason: string): void {
  const metrics = getMessageCaptureMetrics()
  metrics.totalIgnored += 1
  metrics.unknownTypes[`ignored:${reason}`] = (metrics.unknownTypes[`ignored:${reason}`] ?? 0) + 1
}

export function resetMessageCaptureMetricsForTests(): void {
  globalForCapture.whatsappCaptureMetrics = createEmptyMetrics()
}
