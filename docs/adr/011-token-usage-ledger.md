# ADR-011 — Token Usage Ledger

## Status

Accepted (RC-11)

## Contexto

O dashboard de gastos precisa rastrear consumo de tokens OpenAI por categoria (mensagens, fotos, áudios, relatórios) com custo estimado em BRL.

## Decisão

1. Modelo `ApiTokenUsage` com enum `ApiUsageCategory`
2. Custo calculado na persistência via `calculateTokenCostBrl` (`packages/shared/src/config/openai.config.ts`)
3. Preços configuráveis por env:
   - `OPENAI_INPUT_PRICE_PER_1M_BRL` / `OPENAI_OUTPUT_PRICE_PER_1M_BRL`
   - fallback: `OPENAI_AVG_COST_PER_1K_TOKENS_BRL` (default 0.002)
4. Use case `RecordApiTokenUsageUseCase` no core; repositório Prisma no pacote database
5. Instrumentação inicial em `OpenAIChatProvider` (category `agent_message`) e `GenerateDailyChatReportUseCase` (`report_generation`)

## Consequências

- Custos são estimados (não billing real-time da OpenAI)
- Analytics agrega por `occurredAt` (UTC date key YYYY-MM-DD)
