# Prompt log — RC-30 reset data, manual sync, sync chip

**Data:** 2026-07-01  
**Versão alvo:** 1.7.4-rc30

## Objetivo

Implementar reset de dados WhatsApp (mantendo configurações), sincronização manual de contatos em Permissões e substituir banner intrusivo por chip inline.

## Arquivos gerados/alterados

- `packages/database/src/whatsapp-data-reset.ts`
- `packages/core/src/domains/whatsapp-data-reset/`
- `apps/dashboard/src/app/api/settings/reset-whatsapp-data/route.ts`
- `apps/dashboard/src/app/api/whatsapp/sync-contacts/route.ts`
- `apps/dashboard/src/components/settings/whatsapp-data-reset-card.tsx`
- `apps/dashboard/src/components/permissions/contact-sync-chip.tsx`
- `apps/dashboard/src/lib/whatsapp/runtime.ts` — `runManualContactSync`, `resetNameBootstrapFlag`
- `apps/dashboard/src/lib/whatsapp/contact-sync-tracker.ts`
- `packages/whatsapp/src/providers/baileys.provider.ts` — `reconnectForSync`
- `harness/rc-30/index.ts`

## Decisões

- Lógica de mídia extraída de RC-09 para módulo compartilhado
- `applyTimeoutRules` não altera estado `completed`/`error` (evita spam)
- Runtime invalidado após reset para limpar trackers do agente
