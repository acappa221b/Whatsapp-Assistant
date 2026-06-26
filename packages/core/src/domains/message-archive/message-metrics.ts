import type { ArchiveMessageType } from './message-types'

export type MessageCaptureMetrics = {
  totalReceived: number
  totalMapped: number
  totalPersisted: number
  totalFailed: number
  totalIgnored: number
  types: Record<ArchiveMessageType, number>
  unknownTypes: Record<string, number>
  wrappersEncountered: Record<string, number>
}

export function createEmptyMetrics(): MessageCaptureMetrics {
  return {
    totalReceived: 0,
    totalMapped: 0,
    totalPersisted: 0,
    totalFailed: 0,
    totalIgnored: 0,
    types: {
      TEXT: 0,
      AUDIO: 0,
      IMAGE: 0,
      DOCUMENT: 0,
      VIDEO: 0,
      STICKER: 0,
      REACTION: 0,
      CONTACT: 0,
      LOCATION: 0,
      POLL: 0,
      SYSTEM: 0,
      UNKNOWN: 0,
    },
    unknownTypes: {},
    wrappersEncountered: {},
  }
}

export function computeLossRate(metrics: Pick<MessageCaptureMetrics, 'totalReceived' | 'totalPersisted'>): number {
  if (metrics.totalReceived === 0) return 0
  const lost = Math.max(0, metrics.totalReceived - metrics.totalPersisted)
  return lost / metrics.totalReceived
}

export type MessageMetricsSnapshot = {
  totalReceived: number
  totalPersisted: number
  lossRate: number
  types: Record<string, number>
  emptyTextCount: number
}

export type ArchiveHealthSnapshot = {
  received: number
  mapped: number
  persisted: number
  failed: number
  ignored: number
  lossRate: number
  unknownTypes: Record<string, number>
  wrappersEncountered: Record<string, number>
}

export function buildArchiveHealthSnapshot(
  metrics: MessageCaptureMetrics,
): ArchiveHealthSnapshot {
  const received = metrics.totalReceived
  const persisted = metrics.totalPersisted
  const lossRate = received === 0 ? 0 : Math.max(0, received - persisted) / received
  return {
    received,
    mapped: metrics.totalMapped,
    persisted,
    failed: metrics.totalFailed,
    ignored: metrics.totalIgnored,
    lossRate,
    unknownTypes: { ...metrics.unknownTypes },
    wrappersEncountered: { ...metrics.wrappersEncountered },
  }
}

export function buildMetricsSnapshot(input: {
  capture: Pick<MessageCaptureMetrics, 'totalReceived' | 'totalPersisted'>
  persistedByType: Record<string, number>
  emptyTextCount: number
}): MessageMetricsSnapshot {
  return {
    totalReceived: input.capture.totalReceived,
    totalPersisted: input.capture.totalPersisted,
    lossRate: computeLossRate(input.capture),
    types: input.persistedByType,
    emptyTextCount: input.emptyTextCount,
  }
}
