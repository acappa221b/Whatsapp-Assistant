# RC-07 — Filtro de origem segura (grupo WhatsApp)

Data: 2026-06-24  
Versão app: `0.0.9`

## Objetivo

Processar **apenas** mensagens do chat/grupo configurado em `WHATSAPP_MONITORED_CHAT_ID`, descartando outras origens antes do pipeline/OpenAI.

## Configuração

| Variável | Valor local (`.env`) |
|---|---|
| `WHATSAPP_MONITORED_CHAT_ID` | `{id}@g.us` do grupo (ex.: descoberto via log RC-07.5) |

- Lida por `EnvSchema` → `createWhatsappConfig()` → `config.whatsapp.monitoredChatId`
- String vazia = **sem filtro** (comportamento anterior — aceita todas as origens)

Arquivos atualizados: `.env`, `.env.example`, `packages/shared/src/config/env.schema.ts`, `packages/shared/src/config/whatsapp.config.ts`

## Posição do filtro (ponto de ingresso)

```
Baileys socket (messages.upsert)
  → baileys-socket.factory.ts
  → BaileysWhatsappProvider.handleMessages()   ← FILTRO AQUI
       ├─ isAllowedWhatsappOrigin(remoteJid) ?
       │     não → log debug + continue (descarte)
       └─ sim  → media registry → map → onMessage handlers
  → apps/dashboard runtime onMessage
  → eventBus WhatsappMessageReceived
  → WhatsappMessagePipeline (persist + fila)
```

### Arquivo principal

`packages/whatsapp/src/providers/baileys.provider.ts` — método `handleMessages()`, **antes** de:

- `whatsappMediaRegistry.register(raw)`
- `mapBaileysMessage`
- incremento de `messageCount`
- handlers `onMessage` (event bus / pipeline)

### Utilitário

`packages/whatsapp/src/utils/chat-origin-filter.ts`

- Compara `raw.key.remoteJid` com `config.whatsapp.monitoredChatId`
- Log de descarte: `[Pipeline/Filter] Mensagem ignorada: origem {jid} não autorizada`
- Aplica-se igualmente a **TEXT**, **IMAGE**, **DOCUMENT** (e demais tipos mapeados) — validação no `remoteJid` antes do mapeamento por tipo

## O que não foi alterado

- Regras de negócio do pipeline **após** ingresso (processadores, OpenAI, fila)
- Autenticação / proxy local
- Epic 08

## Testes

| Arquivo | Cobertura |
|---|---|
| `chat-origin-filter.test.ts` | whitelist vazia, match, mismatch, jid ausente |
| `baileys.provider.test.ts` | TEXT/IMAGE/DOCUMENT do chat monitorado passam; outro JID bloqueado |

## Validação

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm build` | ✅ |

## Verificação manual

1. `pnpm dev` com `WHATSAPP_MONITORED_CHAT_ID` vazio (descoberta) ou com `...@g.us` do grupo
2. Enviar mensagem no grupo → log `[WhatsApp/Group-Discovery] Mensagem recebida de: {id}@g.us Enviada por: {participant}`
3. Copiar o `remoteJid` `@g.us` para `WHATSAPP_MONITORED_CHAT_ID` no `.env`
4. Mensagens de DMs/outros grupos → `[Pipeline/Filter] Mensagem ignorada...`

Ver também **RC-07.5** — ajuste para filtrar por `remoteJid` do grupo, não `@lid` do remetente.
