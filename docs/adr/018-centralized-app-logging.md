# ADR-018: Logging centralizado na aba Configurações

**Status:** aceito  
**Data:** 2026-06-30  
**Release:** RC-20 (v1.5.2-rc20)

## Contexto

Logs dispersos em `console.*` e `logs/launcher.log` dificultam suporte remoto entre usuários. Não havia UI para diagnóstico operacional (distinto de `/dashboard/diagnostics` que mede fidelidade de mensagens).

## Decisão

1. **Persistência** em `AppLog` (SQLite) via sink central.
2. **Hook de console** no servidor Next.js para capturar código legado sem migração massiva.
3. **Launcher** lido sob demanda e mesclado na API (v1 sem duplicar no DB).
4. **Sanitização** obrigatória de secrets antes de persistir.
5. **Retenção** 5000 linhas / 7 dias com prune debounced.
6. **UI** em Configurações → Logs com filtro, busca, export `.txt`, poll 5s.

## Consequências

- Suporte pode pedir export de logs sem acesso remoto à máquina.
- Secrets nunca devem aparecer em texto claro nos logs persistidos.
- v2 pode adicionar SSE, Sentry ou ingestão remota.

## Alternativas rejeitadas

- Reescrever todos os `console.*` manualmente (custo alto)
- Logs só em arquivo (sem UI)
- Duplicar launcher.log no SQLite em v1
