# WhatsApp Connection UI — Spec

**Epic:** Assistant-01  
**Status:** SPEC ONLY (evolução RC-03)

## Objetivo

Módulo `/dashboard/whatsapp` para conexão Baileys e visibilidade operacional.

## Campos exibidos

| Campo | Fonte |
|-------|-------|
| Status | CONNECTED / CONNECTING / DISCONNECTED / QR |
| QR Code | qrCodeDataUrl (SSE) |
| Nome conta | Baileys creds.me.name |
| Telefone | creds.me.id |
| Qtd chats | count chats |
| Qtd grupos | count @g.us |
| Última mensagem | lastMessageAt |

## Ações

- Conectar (sessão existente)
- Nova sessão (QR fresh)
- Reconectar
- Desconectar

## Dependências

- RC-03 runtime stabilization
- GET /api/whatsapp/status expandido
- POST connect / reconnect / reset-session

## Critérios de Aceite

**Given** sem sessão  
**When** Nova sessão  
**Then** QR exibido em < 15s

**Given** sessão válida  
**When** Conectar  
**Then** status CONNECTED sem QR

Ver [docs/testing/rc-03-whatsapp-runtime-stabilization.md](../../../docs/testing/rc-03-whatsapp-runtime-stabilization.md)
