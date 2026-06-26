# RC-07 — Contact Identity

## ChatIdentityResolver

`packages/shared/src/utils/chat-identity-resolver.ts`

Regras de exibição:

| Tipo | Nome exibido |
|------|--------------|
| DM | Interlocutor (config > peer > chatName válido) |
| Grupo | Subject / config |
| Self-chat | Nome próprio permitido |

Rejeita `chatName` que coincide com own JID em DM alheio.

## Persistência

`ChatContactResolver` + `shouldPersistChatName` bloqueia `fromMe` DM chatName.

## Repair

`repairDmChatNames` + `repairHistoricalMessages` na conexão.
