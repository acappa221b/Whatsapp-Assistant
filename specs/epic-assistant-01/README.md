# Epic Assistant-01 — WhatsApp Message Archive

**Status:** SPEC ONLY — aguardando aprovação formal para implementação  
**Versão spec:** 1.0.0  
**Substitui foco de:** Epics 02, 05, 06, 07, 08 (financeiro)

---

## Objetivo

Construir o **arquivo completo de conversas WhatsApp**: captura de mensagens, chats, grupos, participantes, transcrição de áudios, dashboard Sumário e UI de consulta.

## Escopo IN

- Captura 100% mensagens recebidas (Baileys)
- Persistência chats, grupos, participantes
- Transcrição Whisper de todos os áudios
- UI: Sumário, Mensagens (inbox), WhatsApp, Relatórios (placeholder spec)
- Retenção 60 dias (mensagens)
- Redirect `/` → `/dashboard`
- Menu: Dashboard | Mensagens | WhatsApp | Relatórios
- Renomear produto para **WhatsApp Assistant**

## Escopo OUT

- Responder mensagens automaticamente
- Agente IA conversacional
- Memória ativa / RAG
- Relatórios diários **implementados** (apenas spec — ver [reports-module-spec.md](./reports-module-spec.md))
- OCR financeiro / extrações / pipeline financeiro
- Remoção física de código deprecated (Fase 3 do migration plan)

---

## Módulos da Epic

| Módulo | Spec | Implementação |
|--------|------|---------------|
| Message Archive | [message-archive/README.md](./message-archive/README.md) | Assistant-01 |
| Audio Transcription | [audio-transcription/README.md](./audio-transcription/README.md) | Assistant-01 |
| Messages Inbox UI | [messages-inbox/README.md](./messages-inbox/README.md) | Assistant-01 |
| Dashboard Sumário | [dashboard-summary/README.md](./dashboard-summary/README.md) | Assistant-01 |
| WhatsApp Connection | [whatsapp-connection/README.md](./whatsapp-connection/README.md) | Assistant-01 (evolução RC-03) |
| Daily Reports | [reports-module-spec.md](./reports-module-spec.md) | **Fase 2** |

---

## Ordem de implementação (obrigatória)

```
1.1 Renaming + redirect + menu
1.2 Message capture hardening
1.3 Participants + chats
1.4 Audio download
1.5 Whisper transcription
1.6 Messages inbox UI
1.7 WhatsApp status UI
1.8 Dashboard Sumário
1.9 Retention job
1.10 Hide deprecated routes
```

**Regra:** só avançar após harness + testes da feature anterior.

---

## Artefatos SDD

- [test-matrix.md](./test-matrix.md)
- [events-catalog.md](./events-catalog.md)
- [adr-impact.md](./adr-impact.md)

---

## Critérios de aceite (Epic)

- [ ] Produto renomeado em README, APP_NAME, UI header
- [ ] `/` redireciona para `/dashboard`
- [ ] Menu com exatamente 4 itens
- [ ] Sumário exibe 6 widgets com dados reais
- [ ] Mensagens: inbox com busca + histórico por chat
- [ ] WhatsApp: status, QR, conta, contadores
- [ ] 100% áudios transcritos (quando Whisper habilitado)
- [ ] Retenção 60d funcional
- [ ] Harness epic-assistant-01 verde
- [ ] Coverage ≥ 90% módulos ativos

---

## Dependências

- Epic 04 (WhatsApp foundation) — concluída
- RC-03 (runtime stabilization) — concluída
- OpenAI API key (Whisper)

## Referências

- [docs/product/vision.md](../../docs/product/vision.md)
- [docs/architecture/assistant-overview.md](../../docs/architecture/assistant-overview.md)
- [docs/refactor/migration-plan.md](../../docs/refactor/migration-plan.md)
