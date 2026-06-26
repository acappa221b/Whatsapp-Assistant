# Epic 04 — WhatsApp Integration Foundation

**Status:** Concluída  
**Depende de:** Epic 03

## Objetivo

Infraestrutura de entrada de mensagens WhatsApp sem IA/OCR/financeiro.

## Entregáveis

- [x] BaileysWhatsappProvider (connect, disconnect, onMessage, getStatus)
- [x] Domínio WhatsappMessage + use cases
- [x] Persistência Prisma + migration
- [x] Eventos WhatsApp (5 novos)
- [x] Pipeline Event Bus → persistência
- [x] Dashboard `/dashboard/messages` e `/dashboard/whatsapp`
- [x] QR Code via SSE (ADR-005)
- [x] Testes + harnesses Epic 04

## Próximo

Epic 05 — Message Processing Pipeline ✅
