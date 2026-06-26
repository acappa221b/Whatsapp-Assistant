# RC-05 — Acceptance Criteria

## AC-01 — Archive API

**When** `GET /api/whatsapp/archive/chats`  
**Then** HTTP 200 com `{ items: [...] }` e `items.length > 0` quando há mensagens no DB

## AC-02 — UI chats

**When** abro `/dashboard/messages` com dados no banco  
**Then** coluna esquerda lista chats (não "Nenhum chat ainda")

## AC-03 — Seleção de chat

**When** clico em um chat  
**Then** painel direito exibe somente mensagens daquele `chatId`

## AC-04 — Filtro chatId

**When** `GET /api/whatsapp/messages?chatId=CHAT_A`  
**Then** `total` = contagem de mensagens de CHAT_A (não total global)

## AC-05 — Runtime rebuild

**When** runtime cacheado está incompleto (simulado)  
**Then** `getWhatsappRuntime()` recria runtime com todos os use cases

## AC-06 — UI error state

**When** API de chats falha  
**Then** UI exibe "Erro ao carregar chats" (não confundir com vazio)

## AC-07 — Polling

**When** polling 5s/8s ativo  
**Then** chat selecionado permanece; histórico não é limpo

## AC-08 — Qualidade

- `pnpm lint` verde
- `pnpm typecheck` verde
- `pnpm test:unit` verde
- `pnpm harness` verde (incl. RC-05)
