# RC-09 — Investigação: erro 400 JSON Schema (OpenAI Structured Outputs)

Data: 2026-06-24  
Versão app: `0.0.10`  
Tipo: **investigação apenas** — nenhuma correção de schema aplicada nesta RC.

## Sintoma

Após RC-08 (governança dinâmica), mensagens do grupo correto chegam ao pipeline de IA, mas a chamada OpenAI falha com:

```text
HTTP 400 Bad Request
Invalid schema for response_format 'extraction_result': schema must be a JSON Schema of 'type: "object"', got 'type: "None"'.
```

`param`: `response_format`  
`type`: `invalid_request_error`

## Reprodução controlada

Script: `harness/rc-09/openai-schema-repro.ts`

```bash
pnpm exec tsx harness/rc-09/openai-schema-repro.ts
```

Resultado idêntico ao runtime do dashboard (mesmo modelo e mesmo `zodResponseFormat`).

## Modelo ativo em runtime

| Variável | Valor |
|---|---|
| `OPENAI_MODEL` | `gpt-5-mini` |
| Endpoint usado | `client.beta.chat.completions.parse` (wrapper sobre `chat.completions.create`) |
| Arquivo provider | `packages/ai/src/providers/openai-extraction.provider.ts` |
| Schema Zod | `packages/ai/src/schemas/extraction-result.schema.ts` |
| Helper | `zodResponseFormat(ExtractionResultSchema, 'extraction_result')` |

**Conclusão sobre o modelo:** `gpt-5-mini` suporta Structured Outputs. O 400 **não** é incompatibilidade de modelo legado (ex.: `gpt-3.5-turbo` sem `json_schema`). A rejeição ocorre na validação do schema antes de qualquer inferência.

## Payload `response_format` interceptado

Gerado por `zodResponseFormat` a partir de `z.discriminatedUnion('type', [...])`:

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "extraction_result",
    "strict": true,
    "schema": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "type": { "type": "string", "const": "EXPENSE_CANDIDATE" },
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
            "data": {
              "type": "object",
              "properties": {
                "description": { "type": "string", "minLength": 1 },
                "amount": { "type": "number", "exclusiveMinimum": 0 },
                "categorySuggestion": {
                  "anyOf": [{ "type": "string", "minLength": 1 }, { "type": "null" }]
                },
                "supplierSuggestion": {
                  "anyOf": [{ "type": "string", "minLength": 1 }, { "type": "null" }]
                },
                "date": { "type": "string", "nullable": true },
                "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
              },
              "required": [
                "description",
                "amount",
                "categorySuggestion",
                "supplierSuggestion",
                "date",
                "confidence"
              ],
              "additionalProperties": false
            },
            "model": { "type": "string", "minLength": 1 }
          },
          "required": ["type", "confidence", "data", "model"],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "type": { "type": "string", "const": "REVENUE_CANDIDATE" },
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
            "data": {
              "type": "object",
              "properties": {
                "description": { "type": "string", "minLength": 1 },
                "amount": { "type": "number", "exclusiveMinimum": 0 },
                "date": { "type": "string", "nullable": true },
                "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
              },
              "required": ["description", "amount", "date", "confidence"],
              "additionalProperties": false
            },
            "model": { "type": "string", "minLength": 1 }
          },
          "required": ["type", "confidence", "data", "model"],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "type": { "type": "string", "const": "UNKNOWN" },
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
            "data": {
              "type": "object",
              "properties": {
                "reason": {
                  "anyOf": [{ "type": "string", "minLength": 1 }, { "type": "null" }]
                }
              },
              "required": ["reason"],
              "additionalProperties": false
            },
            "model": { "type": "string", "minLength": 1 }
          },
          "required": ["type", "confidence", "data", "model"],
          "additionalProperties": false
        }
      ],
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  }
}
```

## Causa raiz (confirmada)

### 1. Raiz do schema é `anyOf`, não `type: "object"` — **bloqueante**

`ExtractionResultSchema` usa `z.discriminatedUnion('type', [...])`. O helper `zodResponseFormat` converte isso em JSON Schema com **`anyOf` na raiz**, sem `type: "object"`.

A API OpenAI Structured Outputs (strict) exige que `json_schema.schema` seja um objeto com **`type: "object"`** na raiz. A mensagem de erro confirma:

> `schema must be a JSON Schema of 'type: "object"', got 'type: "None"'`

`type: "None"` = ausência de `type` no nó raiz (comportamento do validador ao encontrar `anyOf` puro).

**Este é o motivo exato do HTTP 400 observado.**

### 2. Problemas secundários (podem falhar após corrigir a raiz)

| Item | Onde | Risco |
|---|---|---|
| `nullable: true` | `data.date` em EXPENSE/REVENUE | Subconjunto strict da OpenAI prefere `type: ["string","null"]` ou `anyOf` — `nullable` não é suportado |
| `exclusiveMinimum: 0` | `data.amount` | Pode não estar no subset suportado; `minimum: 0.01` ou `minimum: 0` é mais seguro |
| `anyOf` aninhado | `categorySuggestion`, `supplierSuggestion`, `reason` | Geralmente aceito **dentro** de `properties`, mas deve ser validado após fix da raiz |
| `minLength` | strings | Normalmente aceito |
| `strict: true` + campos opcionais Zod | `categorySuggestion`, `date`, etc. | Zod marca como `required` no JSON Schema strict (correto para OpenAI), mas o modelo deve sempre preencher null quando ausente |

## Instrumentação adicionada (RC-09)

Em `openai-extraction.provider.ts`, imediatamente antes de `beta.chat.completions.parse`:

```text
[OpenAI/Schema-Debug] operation: extractText | extractVision
[OpenAI/Schema-Debug] model: gpt-5-mini
[OpenAI/Schema-Debug] response_format: { ... JSON completo ... }
```

Visível no terminal do `pnpm dev` na próxima mensagem processada com IA habilitada.

## O que **não** é a causa

- Filtro de chat / governança RC-08 (mensagem chega corretamente ao processor)
- `OPENAI_API_KEY` ausente (RC-06 já validado; erro é 400 de schema, não 401)
- Modelo `gpt-5-mini` incompatível com `json_schema`
- `additionalProperties: false` nos sub-objetos (padrão exigido pelo strict mode)

## Direção de correção (fora do escopo RC-09)

Não implementado nesta RC. Opções prováveis para RC futura:

1. Substituir `z.discriminatedUnion` por `z.object({ type: z.enum([...]), ... })` com `data` polimórfico, ou schema manual `type: object` na raiz.
2. Definir JSON Schema manual compatível com OpenAI strict e validar com Zod **após** o parse.
3. Usar um único objeto com `type` + `data` como `z.record` / union flatten sem `anyOf` na raiz.

## Arquivos relevantes

- `packages/ai/src/providers/openai-extraction.provider.ts`
- `packages/ai/src/schemas/extraction-result.schema.ts`
- `packages/ai/src/schemas/expense-candidate.schema.ts`
- `packages/ai/src/schemas/revenue-candidate.schema.ts`
- `harness/rc-09/openai-schema-repro.ts`
