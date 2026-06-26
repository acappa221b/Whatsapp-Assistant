# Plano de Migração — Finance AI Dashboard → WhatsApp Assistant

**Status:** Planejamento aprovado — aguardando go de implementação  
**Regra:** 1 feature · 1 epic · 1 validação por vez

---

## Fases

### Fase 0 — Documentação (ATUAL) ✅

Entregáveis:

- [x] Visão do produto
- [x] Módulos deprecated mapeados
- [x] Nova arquitetura
- [x] Roadmap Assistant
- [x] Epic Assistant-01 (spec only)
- [x] Harnesses de spec
- [x] ADR-009 pivot
- [x] Spec módulo Relatórios (sem implementação)
- [x] Documentação Whisper

**Gate:** harness `epic-assistant-01` verde + revisão formal.

---

### Fase 1 — Epic Assistant-01: Message Archive

Implementação **sequencial** (não paralela):

| # | Feature | Validação |
|---|---------|-----------|
| 1.1 | Renomear produto (README, APP_NAME, UI header) | Harness config + manual |
| 1.2 | Redirect `/` → `/dashboard` | E2E |
| 1.3 | Menu simplificado (4 itens) | UI harness |
| 1.4 | Desembrulhar + persistir mensagens (já parcial) | Unit + integration |
| 1.5 | Modelo `WhatsappParticipant` + captura usuários | Migration + harness |
| 1.6 | Captura chats/grupos completa | Integration |
| 1.7 | Download áudio + Whisper + persistir transcrição | Unit + manual |
| 1.8 | UI Mensagens (inbox + histórico) | E2E |
| 1.9 | UI WhatsApp (status expandido) | Manual + harness |
| 1.10 | UI Sumário (6 widgets) | API + E2E |
| 1.11 | Retenção 60 dias (job) | Unit + integration |
| 1.12 | Ocultar rotas deprecated (menu) | Harness |

**Gate Fase 1:** todos os critérios de aceite da Epic Assistant-01.

---

### Fase 2 — Relatórios Diários (SPEC → IMPLEMENT)

Pré-requisito: Fase 1 completa.

| # | Feature |
|---|---------|
| 2.1 | Model `DailyReport` + retenção permanente |
| 2.2 | Job agendado (resumo do dia) |
| 2.3 | UI Relatórios (lista + detalhe) |
| 2.4 | Filtros: usuário, grupo, tags futuras |

Spec: [specs/epic-assistant-01/reports-module-spec.md](../../specs/epic-assistant-01/reports-module-spec.md)

---

### Fase 3 — Remoção código financeiro

Pré-requisito: Fase 1 estável 2 semanas.

Seguir [deprecated-modules.md](./deprecated-modules.md) ordem A→F.

| # | Ação |
|---|------|
| 3.1 | Remover rotas UI deprecated |
| 3.2 | Remover API pipeline/extractions |
| 3.3 | Desregistrar handlers financeiros Event Bus |
| 3.4 | Migration drop tables financeiras |
| 3.5 | Remover packages/domínios deprecated |
| 3.6 | Atualizar harness run-all (remover epic-02/05/06/07/08) |

---

### Fase 4 — Infra e rename (opcional)

| # | Ação |
|---|------|
| 4.1 | PostgreSQL produção |
| 4.2 | Rename `@finance-ai/*` → `@whatsapp-assistant/*` |
| 4.3 | Deploy Railway |

---

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Quebrar WhatsApp ao remover pipeline | Desacoplar pipeline financeiro antes de remover Baileys handlers |
| Perda de dados na migration | Backup SQLite; migrations reversíveis |
| Custo Whisper | Config `WHISPER_ENABLED`; limite de duração áudio |
| Retenção 60d apaga dados úteis | Export opcional antes do purge; relatórios permanentes |

---

## Rollback

- Fase 1: feature flags por rota; branch `assistant-01`
- Fase 3: só após tag `v1.0.0-assistant`; manter branch `legacy-finance` por 30 dias

---

## Checklist de go-live Assistant 1.0

- [ ] Epic Assistant-01 100% critérios de aceite
- [ ] Harness CI verde
- [ ] Coverage ≥ 90% nos módulos ativos
- [ ] Documentação Whisper operacional
- [ ] Retenção 60d testada
- [ ] QR + reconexão validados (RC-03)
- [ ] Aprovação formal registrada em `docs/prompts/`
