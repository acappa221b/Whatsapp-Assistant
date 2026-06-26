# Vision Provider

O provider padrão multimodal é o `OpenAIExtractionProvider`.

## Regras

- usa Structured Outputs
- valida a resposta com Zod
- não retorna texto livre
- não cria entidades financeiras
- cada mensagem é processada isoladamente

## Métodos

- `extractText()`
- `extractImage()`
- `extractDocument()`
- `extractAudio()` retorna `NOT_IMPLEMENTED`

## Motivo

Reutiliza a mesma infraestrutura já adotada na Epic 06:

- mesmo pipeline
- mesmo schema
- mesma persistência
- mesmo modelo de auditoria
