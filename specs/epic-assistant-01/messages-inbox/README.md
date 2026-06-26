# Messages Inbox UI — Spec

**Epic:** Assistant-01  
**Status:** SPEC ONLY

## Objetivo

Interface de arquivo completo: lista de chats à esquerda, histórico à direita.

## Layout

```
┌─────────────────┬──────────────────────────────────┐
│  Busca          │  Chat: Nome / ID                 │
│  [___________]  │  ─────────────────────────────── │
│                 │  [Data Hora] User: conteúdo      │
│  Chat 1    12:30│  [Data Hora] User: conteúdo      │
│  Grupo X   11:00│  ...                             │
│  User Y    ontem│                                  │
└─────────────────┴──────────────────────────────────┘
```

## Campos exibidos por mensagem

| Campo | Fonte |
|-------|-------|
| Data | receivedAt (date) |
| Hora | receivedAt (time) |
| ChatId | chatId |
| UserId | sender / participantId |
| Nome usuário | WhatsappParticipant.displayName |
| Tipo | messageType |
| Conteúdo | content OR transcription.text |

## Regras de Negócio

1. Lista ordenada por última mensagem (desc)
2. Busca por: nome chat, chatId, telefone (parcial)
3. Mesclar rotas `/dashboard/messages` e `/dashboard/chats`
4. Áudio transcrito exibido como TEXT visualmente

## Critérios de Aceite

**Given** 10 chats com mensagens  
**When** usuário abre Mensagens  
**Then** lista ordenada por recência

**Given** busca "Financeiro"  
**When** usuário digita no campo  
**Then** filtra chats cujo nome contém termo

**Given** chat selecionado  
**When** usuário clica  
**Then** histórico completo paginado (scroll infinito ou paginação)

## Estratégia de Testes

- E2E Playwright: inbox + seleção chat
- API: GET /api/whatsapp/chats, GET /api/whatsapp/messages?chatId=
