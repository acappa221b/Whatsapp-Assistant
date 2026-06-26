# Epic Assistant-01 — Test Matrix

| ID | Módulo | Cenário | Tipo | Prioridade |
|----|--------|---------|------|------------|
| ASST-001 | Message Archive | Persist TEXT simple | Unit | P0 |
| ASST-002 | Message Archive | Unwrap ephemeral | Unit | P0 |
| ASST-003 | Message Archive | Dedup externalMessageId | Integration | P0 |
| ASST-004 | Message Archive | Upsert participant | Integration | P0 |
| ASST-005 | Message Archive | Upsert chat | Integration | P0 |
| ASST-006 | Audio | Download OGG | Integration | P0 |
| ASST-007 | Audio | Whisper transcribe | Integration | P0 |
| ASST-008 | Audio | Retry on failure | Unit | P1 |
| ASST-009 | UI Inbox | List chats sorted | E2E | P0 |
| ASST-010 | UI Inbox | Search by name | E2E | P1 |
| ASST-011 | UI Inbox | Chat history | E2E | P0 |
| ASST-012 | Sumário | Messages by day chart | Integration | P0 |
| ASST-013 | Sumário | Photos by day chart | Integration | P0 |
| ASST-014 | Sumário | Top 10 users | Integration | P0 |
| ASST-015 | Sumário | Totals KPI | Integration | P0 |
| ASST-016 | WhatsApp | QR generation | E2E | P0 |
| ASST-017 | WhatsApp | Auto reconnect | Integration | P0 |
| ASST-018 | Retention | Purge > 60 days | Integration | P0 |
| ASST-019 | Retention | Keep reports forever | Unit | P1 |
| ASST-020 | Product | Redirect / → /dashboard | E2E | P0 |
| ASST-021 | Product | Menu 4 items | Harness | P0 |
| ASST-022 | Product | APP_NAME WhatsApp Assistant | Harness | P0 |
| ASST-023 | Reports | Placeholder page | E2E | P2 |
| ASST-024 | Spec | All module READMEs | Harness | P0 |
| ASST-025 | Deprecated | Map exists | Harness | P0 |

## Coverage target

≥ 90% em: `packages/whatsapp`, domínios assistant em `packages/core`, APIs summary/messages.
