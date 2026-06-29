# RC-15 — Dashboard scroll, custos, ordenação #N, WhatsApp em Configurações, agent multimídia, Chat IA

**Versão:** 1.4.1-rc15

## Escopo

1. Dashboard com scroll interno (`overflow-y-auto` + `wa-scroll`)
2. Custos API estimados via `ai-provider-pricing.ts`
3. Ordenação numérica por `#N` em Permissões e Mensagens
4. WhatsApp movido para aba em Configurações
5. Agent responde após áudio/foto processados (`stripMediaPrefix`)
6. Chat IA: heuristic primeiro, erros claros, sem exigir WA em queries

## Critérios

| ID | Critério |
|----|----------|
| AC-01 | Dashboard rola com scrollbar visível |
| AC-02 | Custos API > 0 após uso |
| AC-04 | Permissões ordena #1, #2, #3… |
| AC-06 | Sem item WhatsApp no menu |
| AC-07/08 | Agent responde áudio/foto |
| AC-09/10 | Chat IA envia e mostra erros reais |
