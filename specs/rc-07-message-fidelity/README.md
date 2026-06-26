# RC-07 — Message Fidelity Investigation

**Versão alvo:** 1.0.7-rc07f

## Objetivo

Investigar, documentar e corrigir a raiz dos problemas do Message Archive — **sem novas features**.

## Escopo IN

- Unwrapper único para todos os wrappers Baileys
- `ChatIdentityResolver` centralizado
- Métricas `archive/health` (lossRate = 0%)
- `RepairHistoricalMessages`
- Logs `[RC07/*]`
- Diagnóstico em `/dashboard/diagnostics`
- Auditoria de áudio (sem Whisper)

## Escopo OUT

- Whisper, IA conversacional, novos módulos

## Documentação

- `docs/investigations/rc-07/`
- `acceptance-criteria.md`
- `test-matrix.md`
- `root-causes.md`
