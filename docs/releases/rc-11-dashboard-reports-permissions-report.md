# Release Report — RC-11 (1.2.0-rc11)

## Resumo

Dashboard com dados reais, ledger de tokens/custos, relatórios diários, permissões v2 e fix de saudações IA.

## Entregas

- Fix `isGreetingMessage` + regra OpenAI #11
- `GET /api/dashboard/metrics` + UI Recharts + MonthPicker
- `ApiTokenUsage` + `RecordApiTokenUsageUseCase`
- `ConversationDailyReport` + job diário + UI/API relatórios
- Permissões: Resposta IA / Áudio / Foto / Relatório (sem coluna IA)
- `WhatsappHeaderStatus` no layout; banner removido de Mensagens
- `MediaProcessingPipeline` (gates foto/áudio)

## Validação

```bash
pnpm db:migrate
pnpm db:generate
pnpm test
pnpm harness
pnpm dev  # reiniciado limpo — http://localhost:4000
```

## Smoke manual

- `/dashboard` — gráficos reais, trocar mês
- Permissões — 4 switches + Habilitado
- `oi` → resposta IA com Resposta IA habilitada
- Header Connected + última conexão
- Mensagens sem banner verde
