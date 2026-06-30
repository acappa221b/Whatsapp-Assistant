# RC-17 — Módulo de Treinamento da IA

**Versão:** 1.5.0-rc17  
**Status:** implementado

## Objetivo

Configurações → aba **IA**: persona, base de conhecimento, comportamento e simulador de resposta integrados ao auto-reply WhatsApp e Chat IA.

## Escopo v1

- `AiPersonaProfile` (singleton) + `AiKnowledgeDocument`
- Upload: `.xlsx`, `.csv`, `.txt`, `.png`, `.jpg`
- Keyword search na KB (sem embeddings)
- `ComposeAgentPromptUseCase` substitui `SYSTEM_PROMPT` fixo
- Preview via `/api/settings/ai/preview`

## Fora de escopo v1

- pgvector / embeddings
- PDF
- Persona por chat (`personaOverride` em `WhatsappChatConfig`) — v1.1
- Fine-tuning

## APIs

| Método | Rota |
|--------|------|
| GET/PATCH | `/api/settings/ai/persona` |
| GET/POST/DELETE | `/api/settings/ai/knowledge` |
| GET | `/api/settings/ai/knowledge/:id` |
| POST | `/api/settings/ai/knowledge/:id/reprocess` |
| POST | `/api/settings/ai/preview` |

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Aba IA visível em Configurações |
| AC-02 | Modo Pessoal vs Empresa altera prompt |
| AC-03 | Upload Excel → ready → preview parse |
| AC-04 | Simulador usa catálogo |
| AC-05 | Auto-reply usa persona + KB |
| AC-06 | learnFromHistory configurável |
| AC-07 | Imagens → vision ingest |
| AC-08 | Template Excel + docs |

## Arquivos principais

- `packages/core/src/domains/ai-training/`
- `apps/dashboard/src/components/settings/ai-training/`
- `apps/dashboard/src/lib/ai-training/`
- `packages/database/prisma/schema.prisma`
