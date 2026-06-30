# RC-20 — Aba Logs em Configurações

**Versão:** 1.5.2-rc20  
**Status:** implementado

## Objetivo

Centralizar logs do app (servidor + launcher) em Configurações → **Logs**, com filtro de erros, busca, exportação para suporte e retenção automática.

## Modelo

- `AppLog` no SQLite com níveis `debug | info | warn | error`
- Domínios: `system`, `launcher`, `whatsapp`, `api`, `ai`, `assistant`, `database`, `jobs`
- Retenção: máx. 5000 linhas, 7 dias (prune debounced)

## APIs

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/settings/logs` | Lista paginada + merge `logs/launcher.log` |
| DELETE | `/api/settings/logs` | Limpa SQLite (não apaga launcher.log) |
| GET | `/api/settings/logs/export` | Download `.txt` para suporte |

## Captura

- `instrumentation.ts` + `console-hook` interceptam `console.*`
- `ensureServerReady()` instala hook como fallback
- Logs do launcher lidos em tempo de consulta (não duplicados no DB v1)

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Aba Logs visível em Configurações |
| AC-02 | Erros de API/WhatsApp aparecem na lista |
| AC-03 | Filtro "Somente erros" mostra só `error` em vermelho |
| AC-04 | Filtro "Todos" mostra info/warn/error |
| AC-05 | Logs do launcher com `source: launcher` |
| AC-06 | Busca por texto funciona |
| AC-07 | Exportar gera `.txt` |
| AC-08 | API keys mascaradas |
| AC-09 | Retenção prune no append |
| AC-10 | Auto-refresh 5s |
