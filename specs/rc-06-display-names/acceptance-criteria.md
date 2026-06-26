# RC-06 — Critérios de aceite

## AC-01 — Grupo com subject

Dado grupo `@g.us` com subject conhecido, lista de chats exibe nome do grupo, não ID numérico.

## AC-02 — Contato com pushName ou contacts.upsert

Mensagens exibem nome do remetente quando disponível via pushName ou cache de contato.

## AC-03 — Chat @lid

UI exibe pushName ou `"Contato"` — nunca `14852013740151@lid` ou número LID cru.

## AC-04 — Zero JID na UI

Cabeçalho da conversa e bolhas não renderizam `chatId`, `senderId` nem JIDs.

## AC-05 — Backfill

Mensagem persistida sem nome é enriquecida quando nome é descoberto depois.

## AC-06 — Harness

`pnpm harness` verde incluindo `harness/rc-06`.

## AC-07 — Versão

README em **1.0.4-rc06** com entrada no histórico.
