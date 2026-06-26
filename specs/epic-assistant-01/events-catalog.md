# Epic Assistant-01 — Events Catalog

## Eventos novos

| Evento | Payload | Emissor |
|--------|---------|---------|
| `WhatsappMessageStored` | `{ messageId, chatId, messageType }` | StoreWhatsappMessageUseCase |
| `WhatsappParticipantDiscovered` | `{ participantId, jid, displayName? }` | UpsertParticipantUseCase |
| `WhatsappChatDiscovered` | `{ chatId, name?, type }` | UpsertChatUseCase |
| `WhatsappAudioReceived` | `{ messageId, storagePath }` | Media pipeline |
| `TranscriptionCompleted` | `{ messageId, transcriptionId, textLength }` | TranscribeAudioUseCase |
| `TranscriptionFailed` | `{ messageId, reason }` | TranscribeAudioUseCase |
| `RetentionPurged` | `{ deletedCount, cutoffDate }` | RetentionPurgeJob |

## Eventos mantidos (Epic 04)

| Evento | Status |
|--------|--------|
| `WhatsappMessageReceived` | 🟢 Ativo |
| `WhatsappConnected` | 🟢 Ativo |
| `WhatsappDisconnected` | 🟢 Ativo |
| `WhatsappQrUpdated` | 🟢 Ativo |

## Eventos deprecated (não emitir em código novo)

| Evento | Substituído por |
|--------|-----------------|
| `ExpenseExtractionCompleted` | — (remover Fase 3) |
| `FinancialCandidateCreated` | — |
| `MessageProcessingJobCompleted` | TranscriptionCompleted |

## Eventos futuros (Fase 2 — Relatórios)

| Evento | Payload |
|--------|---------|
| `DailyReportGenerated` | `{ reportId, reportDate, type }` |
