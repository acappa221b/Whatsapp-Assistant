# ADR-007 — Structured Outputs como padrão obrigatório

**Status:** Aceito  
**Data:** 2025-06-23  
**Epic:** 06

## Contexto

A camada de IA passa a transformar mensagens WhatsApp em candidatos estruturados auditáveis. Respostas em texto livre dificultam validação, persistência, testes e rastreabilidade.

Alternativas consideradas:

1. **Texto livre + parser manual**  
2. **Structured Outputs + Zod**

## Decisão

Adotar **Structured Outputs** como padrão obrigatório para toda integração com IA.

## Regras

1. Toda resposta da IA deve aderir a um schema Zod.
2. O provider deve usar Structured Outputs, nunca texto livre.
3. O resultado persistido deve ser armazenado como JSON completo em `Extraction.data`.
4. A IA pode criar apenas **candidatos**; nunca `Expense` ou `Revenue`.

## Consequências

- Erros de contrato aparecem cedo, no provider ou no parse.
- Testes podem usar `MockAIExtractionProvider` sem depender da OpenAI.
- A trilha de auditoria dos candidatos fica reprodutível e consistente.
- OCR continua desacoplado e pode ser adicionado depois sem mudar o contrato principal.

## Referências

- [docs/architecture/overview.md](../architecture/overview.md)
- [ADR-006 — Processamento Desacoplado](./006-decoupled-processing.md)
