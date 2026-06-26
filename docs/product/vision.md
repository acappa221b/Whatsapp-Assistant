# WhatsApp Assistant — Visão do Produto

**Status:** Assistant-01A concluído — Assistant-01B pendente  
**Substitui:** Finance AI Dashboard  
**Versão alvo:** 1.0.0 (Assistant)

---

## Nome e posicionamento

| Antes | Depois |
|-------|--------|
| Finance AI Dashboard | **WhatsApp Assistant** |
| Sistema financeiro com WhatsApp | **Assistente de memória conversacional via WhatsApp** |

## Problema

Conversas do WhatsApp são dispersas, não indexadas e difíceis de consultar. Áudios ficam inacessíveis como texto. Não há memória de longo prazo nem relatórios consolidados.

## Solução

Capturar **todas** as mensagens, chats, grupos e participantes; transcrever **todos** os áudios; indexar texto; reter histórico conversacional; gerar relatórios diários; preparar base para IA futura que converse como o usuário.

## Objetivos (ordem de prioridade)

1. **Arquivo de mensagens** — persistência completa e consultável
2. **Transcrição de áudio** — Whisper em todos os áudios recebidos
3. **Sumário** — dashboard com métricas dos últimos 30 dias
4. **Conexão WhatsApp** — Baileys estável (QR, status, sessão)
5. **Memória conversacional** — retenção 60 dias de mensagens; relatórios permanentes
6. **Relatórios diários** — spec na Fase 2; implementação posterior
7. **IA conversacional** — fora de escopo nesta fase

## O que NÃO é o produto

- Sistema de despesas / receitas
- OCR de notas fiscais para finanças
- Fila de aprovação financeira
- Exportação Excel financeira
- Agente que responde mensagens automaticamente (nesta fase)

## Princípios de execução

- **1 feature por vez**
- **1 epic por vez**
- **1 validação por vez**
- Spec Driven Development (SDD)
- Harnesses obrigatórios antes de merge
- ADRs para decisões arquiteturais
- Nenhuma feature sem spec aprovada

## Usuário-alvo

Pessoa física ou profissional que usa WhatsApp como canal principal de comunicação e quer:

- Histórico pesquisável
- Áudios como texto
- Visão agregada (sumário)
- Base para relatórios e IA futura

## Métricas de sucesso (Assistant-01)

| Métrica | Meta |
|---------|------|
| Mensagens capturadas | 100% das recebidas (exceto `fromMe`) |
| Áudios transcritos | 100% dos áudios recebidos |
| Tempo até persistência | < 5s após `messages.upsert` |
| Retenção | 60 dias rolling para mensagens |
| Uptime conexão Baileys | Reconexão automática documentada |
| Dashboard Sumário | 6 widgets funcionais |

## Referências

- [Arquitetura](../architecture/assistant-overview.md)
- [Plano de migração](../refactor/migration-plan.md)
- [Módulos deprecated](../refactor/deprecated-modules.md)
- [Epic Assistant-01](../../specs/epic-assistant-01/README.md)
- [Roadmap](../../ROADMAP.md)
- [ADR-009 — Pivot de produto](../adr/009-product-pivot-whatsapp-assistant.md)
