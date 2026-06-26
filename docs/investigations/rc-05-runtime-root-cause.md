# RC-05 — Causa raiz do runtime stale

**Data:** 2025-06-25  
**Status:** Confirmado

## Sintoma

- `GET /api/whatsapp/archive/chats` → HTTP 500
- `listChatArchiveUseCase.execute()` funciona quando instanciado fresh
- `GET /api/whatsapp/messages?chatId=X` retorna `total: 310` (global)

## Mecanismo

```typescript
// apps/dashboard/src/lib/whatsapp/runtime.ts (antes do RC-05 fix)
export function getWhatsappRuntime(): WhatsappRuntime {
  if (!globalForWhatsapp.whatsappRuntime) {
    globalForWhatsapp.whatsappRuntime = createRuntime()
  }
  return globalForWhatsapp.whatsappRuntime
}
```

1. Processo `next dev` inicia e cria `globalForWhatsapp.whatsappRuntime` **sem** `listChatArchiveUseCase` (código pré-RC-04).
2. Hot Module Replacement atualiza arquivos fonte mas **não limpa** `globalThis`.
3. RC-04 adiciona `listChatArchiveUseCase` em `createRuntime()`, porém singleton antigo permanece.
4. `archive/chats/route.ts` faz destructuring:
   ```typescript
   const { listChatArchiveUseCase } = getWhatsappRuntime()
   await listChatArchiveUseCase.execute() // TypeError: undefined
   ```
5. Catch genérico → HTTP 500 `"Failed to list chat archive"`.

## Por que `/messages` parecia funcionar parcialmente

`listUseCase` existia antes do RC-04. API respondia 200, mas:
- Filtro `chatId` adicionado no RC-04 não existia no runtime stale → `total` global.
- Campos RC-04 (`senderId`, etc.) ausentes na resposta JSON.

## Por que a UI ficava vazia

`MessageArchiveView` depende exclusivamente de `/api/whatsapp/archive/chats` para a coluna esquerda. HTTP 500 → `items` undefined → array vazio → *"Nenhum chat ainda"* (sem distinguir erro).

## Correção RC-05

1. `WHATSAPP_RUNTIME_VERSION` — bump invalida cache
2. `checkRuntimeIntegrity()` — valida todos os use cases obrigatórios
3. Auto-rebuild + reset `whatsappPipelinesRegistered` + `whatsappBootstrapPromise`
4. Logs: `[RUNTIME_INIT]`, `[RUNTIME_REBUILD]`, `[RUNTIME_INVALID]`
5. UI diferencia erro vs vazio

## Evidências

- Investigação RC-05: `docs/investigations/rc-05-message-archive-ui-disconnect.md`
- DB: 310 mensagens, 16 chats — dados íntegros
- Use case isolado: SUCCESS count=16
