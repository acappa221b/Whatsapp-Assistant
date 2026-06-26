# RC-10 — Correção do contrato OpenAI JSON Schema

Data: 2026-06-25  
Versão app: `0.0.11`

## Objetivo

Corrigir o `ExtractionResultSchema` para que o `zodResponseFormat()` gere um JSON Schema com `type: "object"` na raiz, removendo o erro 400 detectado na RC-09.

## Resumo da correção

### Antes

- `ExtractionResultSchema` usava `z.discriminatedUnion('type', [...])`
- O helper `zodResponseFormat()` produzia `schema.anyOf` na raiz
- A OpenAI rejeitava o payload com:

```text
Invalid schema for response_format 'extraction_result':
schema must be a JSON Schema of 'type: "object"', got 'type: "None"'.
```

### Depois

- `ExtractionResultSchema` foi reestruturado para um `z.object(...).strict()` na raiz
- O campo `type` passou a ser `z.enum(['EXPENSE_CANDIDATE', 'REVENUE_CANDIDATE', 'UNKNOWN'])`
- O campo `data` passou a ser um objeto unificado e estrito, validado por `superRefine()` conforme o tipo lógico
- O `OpenAIExtractionProvider` continua retornando o formato interno esperado pelo pipeline

## Payload gerado após a correção

Trecho relevante do `response_format`:

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "extraction_result",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "EXPENSE_CANDIDATE",
            "REVENUE_CANDIDATE",
            "UNKNOWN"
          ]
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "data": {
          "type": "object"
        },
        "model": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": ["type", "confidence", "data", "model"],
      "additionalProperties": false
    }
  }
}
```

## Ajustes de compatibilidade strict mode

- `amount` deixou de usar `positive()` e passou a usar `min(0)` no schema enviado
- `date` passou a gerar `type: ["string", "null"]` em vez de `nullable: true`
- Os campos nullable continuam explícitos no payload (`null` quando ausentes), o que reduz ambiguidade no strict mode

## Adaptação do provider

Arquivo: `packages/ai/src/providers/openai-extraction.provider.ts`

- Mantidos os logs:
  - `[OpenAI/Schema-Debug] operation: ...`
  - `[OpenAI/Schema-Debug] model: ...`
  - `[OpenAI/Schema-Debug] response_format: ...`
- O provider agora tipa o retorno parseado como `ExtractionResult`
- `normalizeResult()` preserva o contrato interno (`sourceType`, tokens, storagePath, model fallback)

## Prova de resolução

Script de reprodução:

```bash
pnpm exec tsx harness/rc-09/openai-schema-repro.ts
```

Resultado após RC-10:

```text
[rc-09/repro] SUCCESS — schema aceito pela API
```

## Validação executada

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
```

Resultado:

- `lint` OK
- `typecheck` OK
- `test:unit` OK (`259` testes)
- `build` OK

## Arquivos alterados

- `packages/ai/src/schemas/extraction-result.schema.ts`
- `packages/ai/src/schemas/extraction-result.schema.test.ts`
- `packages/ai/src/providers/openai-extraction.provider.ts`
- `packages/ai/src/providers/openai-extraction.provider.test.ts`
- `README.md`
- `docs/testing/rc-10-schema-resolution.md`

## Estado esperado do runtime

Com o dev server ativo e o chat `120363421372276062@g.us` com IA habilitada em `/dashboard/chats`, a próxima mensagem pendente do grupo já pode seguir para a OpenAI sem o erro 400 do `response_format`.
