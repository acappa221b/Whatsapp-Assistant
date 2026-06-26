# RC-11 — Dashboard real, tokens, relatórios, permissões v2

**Versão alvo:** 1.2.0-rc11

## Escopo

- Dashboard com métricas reais (Recharts) e seletor de mês
- Ledger `ApiTokenUsage` + custos estimados em BRL
- Relatórios diários por chat (`ConversationDailyReport`)
- Permissões v2: Habilitado, Resposta IA, Áudio, Foto, Relatório (sem coluna IA)
- Fix saudações IA (`oi`, `olá`) — não skip antes do LLM
- Header global com status WhatsApp compacto; remover banner verde em Mensagens

## Referências

- `specs/epic-assistant-01/dashboard-summary/README.md`
- `specs/epic-assistant-01/reports-module-spec.md`
- `docs/adr/011-token-usage-ledger.md`
