# Epic Assistant-01 — ADR Impact

| ADR | Impacto |
|-----|---------|
| [ADR-001](../../docs/adr/001-general-architecture.md) | Superseded parcialmente — arquitetura financeira deprecated |
| [ADR-002](../../docs/adr/002-event-driven-architecture.md) | Mantido — Event Bus continua |
| [ADR-003](../../docs/adr/003-sqlite-postgresql.md) | Mantido |
| [ADR-004](../../docs/adr/004-soft-delete.md) | Deprecated para Expense; não aplicar a WhatsappMessage |
| [ADR-005](../../docs/adr/005-whatsapp-qr-sse.md) | Mantido |
| [ADR-006](../../docs/adr/006-decoupled-processing.md) | Pipeline financeiro deprecated; transcrição async mantém princípio |
| [ADR-007](../../docs/adr/007-structured-outputs-required.md) | Deprecated (extração financeira) |
| [ADR-009](../../docs/adr/009-product-pivot-whatsapp-assistant.md) | **Novo — governa pivot** |

## ADRs propostos (implementação)

| ADR | Tópico |
|-----|--------|
| ADR-010 | Retenção 60 dias + purge job |
| ADR-011 | Transcription table vs content field |
| ADR-012 | Whisper como único provider STT v1 |
