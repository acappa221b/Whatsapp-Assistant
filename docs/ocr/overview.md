# OCR + Multimodal Extraction

Epic 07 expande a camada de extração para suportar:

- `TEXT`
- `IMAGE`
- `DOCUMENT`

Sem criar `Expense`, `Revenue` ou qualquer entidade financeira final.

## Fluxo

WhatsApp Message -> Processor Resolver -> MediaDownloader -> OpenAI Vision -> Structured Output -> Extraction -> Dashboard

## Resultado

Toda saída continua sendo uma `Extraction` auditável com:

- `EXPENSE_CANDIDATE`
- `REVENUE_CANDIDATE`
- `UNKNOWN`

## Observabilidade

Cada extração pode persistir:

- `sourceType`
- `processingTimeMs`
- `tokensInput`
- `tokensOutput`
- `model`
- `storagePath`
