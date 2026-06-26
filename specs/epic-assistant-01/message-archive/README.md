# Message Archive — Spec

**Epic:** Assistant-01  
**Status:** SPEC ONLY

## Objetivo

Persistir todas as mensagens WhatsApp recebidas com metadados completos para consulta e indexação.

## Definição

Entidade central: `WhatsappMessage` (evolução do model existente).

Novas entidades:

- `WhatsappParticipant` — usuário WhatsApp (jid, displayName, phone)
- `WhatsappChat` — conversa ou grupo (chatId, name, type, lastMessageAt)

## Campos — WhatsappMessage (evolução)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | cuid | sim | PK |
| externalMessageId | string | sim | ID Baileys |
| chatId | string | sim | JID conversa/grupo |
| sender | string | sim | JID remetente |
| participantId | string | não | FK WhatsappParticipant |
| content | string | sim | Texto ou caption |
| messageType | enum | sim | TEXT, AUDIO, IMAGE, DOCUMENT, UNKNOWN |
| mediaUrl | string | não | Referência mídia |
| storagePath | string | não | Path local |
| receivedAt | datetime | sim | Timestamp mensagem |
| processed | boolean | sim | Legacy — deprecar em favor de transcription status |

## Regras de Negócio

1. Ignorar mensagens `fromMe=true`
2. Desembrulhar envelopes (ephemeral, viewOnce, edited) antes de persistir
3. Upsert participante a cada mensagem nova
4. Upsert chat a cada mensagem nova
5. Deduplicar por `externalMessageId`
6. Não sobrescrever mensagem existente com conteúdo vazio

## Invariantes

- `externalMessageId` único
- `receivedAt` sempre UTC
- `chatId` nunca vazio

## Casos de Uso

- **UC-MA-01** Persistir mensagem TEXT
- **UC-MA-02** Persistir mensagem IMAGE/DOCUMENT com metadata
- **UC-MA-03** Persistir mensagem AUDIO (sem transcrição ainda)
- **UC-MA-04** Upsert participante e chat

## Eventos Emitidos

- `WhatsappMessageReceived`
- `WhatsappMessageStored`
- `WhatsappParticipantDiscovered`
- `WhatsappChatDiscovered`

## Dependências

- `@finance-ai/whatsapp` — mapBaileysMessage, unwrap
- `@finance-ai/database` — Prisma repositories

## Critérios de Aceite

**Given** Baileys emite `messages.upsert` com texto simples  
**When** pipeline processa  
**Then** mensagem aparece no DB com content preenchido

**Given** mensagem encapsulada em ephemeralMessage  
**When** pipeline processa  
**Then** content extraído do envelope interno

**Given** mensagem duplicada (mesmo externalMessageId)  
**When** pipeline processa novamente  
**Then** não cria duplicata

## Casos de Borda

- Chat `@lid` sem participant
- Mensagem UNKNOWN sem conteúdo
- Timestamp Long protobuf

## Estratégia de Testes

- Unit: `mapBaileysMessage`, unwrap
- Integration: store + list use cases
- Harness: `MessageArchiveSpecHarness`
