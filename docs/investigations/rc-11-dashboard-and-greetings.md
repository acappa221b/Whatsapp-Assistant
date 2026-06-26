# RC-11 — Dashboard parado + saudações IA

## Sintomas

1. `oi` / `olá` não recebiam resposta — RC-10B `shouldSkipBeforeLLM` tratava mensagens ≤12 chars sem `?` como ack-only
2. `/dashboard` exibia widgets mock (`SUMMARY_PLACEHOLDERS`)
3. Permissões tinham coluna IA redundante; faltavam switches Áudio/Foto/Relatório

## Causa raiz

- Gate genérico de tamanho em `should-auto-reply-to-message.ts`
- Dashboard nunca integrado com Prisma analytics
- `aiProcessingEnabled` acoplava agent + pipeline legado

## Correção

- `isGreetingMessage()` com exceção explícita antes do gate de tamanho
- Domínio `dashboard-analytics` + `GET /api/dashboard/metrics`
- Permissões v2 com flags independentes quando `archiveEnabled=true`
- Ledger `ApiTokenUsage` para custos

## Arquivos

- `should-auto-reply-to-message.ts`
- `apps/dashboard/src/components/dashboard/dashboard-analytics-view.tsx`
- `whatsapp-chat-config.entity.ts`
- `schema.prisma` — `ApiTokenUsage`, `ConversationDailyReport`, flags v2
