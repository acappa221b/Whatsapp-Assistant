# RC-07 — Acceptance Criteria

## Parser / Wrappers

- [ ] `unwrapBaileysMessage` desembrulha ephemeral, viewOnce (v1/v2/extension), edited, deviceSent, futureProof, documentWithCaption, album
- [ ] Wrappers aninhados até profundidade 12
- [ ] `interactiveResponseMessage` preserva texto
- [ ] Nenhum TEXT válido vira UNKNOWN por falha de unwrap

## Contact Identity

- [ ] DM exibe nome do interlocutor, nunca o próprio (exceto self-chat)
- [ ] Grupo exibe subject
- [ ] API archive/chats e messages usam `ChatIdentityResolver`

## Persistence Guarantee

- [ ] `GET /api/whatsapp/archive/health` retorna received, mapped, persisted, failed, ignored, lossRate, unknownTypes
- [ ] Toda mensagem em `messages.upsert` gera registro (sem filtro fromMe)

## Backfill

- [ ] `repairHistoricalMessages` reconstrói content/names sem alterar ids

## Logs

- [ ] `[RC07/PARSER]`, `[RC07/WRAPPER]`, `[RC07/CONTACT]`, `[RC07/IMAGE]`, `[RC07/PERSIST]`, `[RC07/BACKFILL]`, `[RC07/AUDIO]`

## Diagnostics

- [ ] `/dashboard/diagnostics` mostra health + fidelity + wrappers
