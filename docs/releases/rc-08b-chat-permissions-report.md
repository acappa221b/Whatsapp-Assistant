# Release report — RC-08B Chat Permissions

**Versão:** 1.0.8-rc08b  
**Data:** 2025-06-25

## Entregas

| Item | Status |
|------|--------|
| Campo `archiveEnabled` + migration backfill | ✅ |
| Regras de cascata no domínio | ✅ |
| `DeleteChatHistoryUseCase` | ✅ |
| API GET/PATCH chats + DELETE history | ✅ |
| Filtro `listChatSummaries` por archive | ✅ |
| Guard 403 em messages por chatId | ✅ |
| UI Permissões + sidebar | ✅ |
| Redirect `/dashboard/chats` → permissions | ✅ |
| Harness rc-08b | ✅ |
| Spec + README | ✅ |

## Comportamento

- **Habilitado** controla visibilidade em Mensagens
- **IA** depende de Habilitado; pipeline respeita `aiProcessingEnabled`
- **Lixeira** apaga mensagens e mídia; chat permanece em Permissões desabilitado
- Captura WhatsApp continua para todos os chats

## Validação

```bash
pnpm db:migrate && pnpm db:generate
pnpm test:unit && pnpm typecheck && pnpm lint && pnpm harness && pnpm build
```
