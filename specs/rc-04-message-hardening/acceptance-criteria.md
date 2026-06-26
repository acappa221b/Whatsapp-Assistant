# RC-04 — Acceptance Criteria

## AC-01 — Zero perda

**Given** N mensagens recebidas pelo Baileys  
**When** consulto `GET /api/whatsapp/metrics`  
**Then** `totalReceived === totalPersisted` e `lossRate === 0`

## AC-02 — UNKNOWN controlado

**When** métricas calculadas  
**Then** `UNKNOWN / totalPersisted < 0.01` (meta operacional; testes usam fixtures)

## AC-03 — TEXT sem vazio

**When** consulto mensagens com `messageType = TEXT`  
**Then** nenhuma tem `content` vazio ou `—`

## AC-04 — rawPayload

**When** qualquer mensagem persistida  
**Then** `rawPayload` contém JSON do evento Baileys original

## AC-05 — Menu Message Archive

**When** abro `/dashboard/messages`  
**Then** layout 2 colunas: lista de chats (esquerda) + conversa (direita)

## AC-06 — Chats por atividade

**When** lista de chats carregada  
**Then** ordenada por última atividade decrescente, com contagem e preview

## AC-07 — Identidade participante

**When** `pushName` ou nome de chat disponível  
**Then** UI exibe nome legível, não apenas JID `@lid`

## AC-08 — Páginas legadas intactas

**When** acesso URL direta `/dashboard/pipeline`  
**Then** página ainda funciona (sem link na nav)

## AC-09 — Qualidade

- `pnpm lint` verde
- `pnpm typecheck` verde
- `pnpm test:unit` verde
- `pnpm harness` verde (incl. RC-04)
- `pnpm build` verde

## AC-10 — Não escopo

**Then** nenhum código Whisper/OpenAI/RAG adicionado nesta RC
