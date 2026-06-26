# Extração de texto WhatsApp incompleta

## Sintomas

- Na UI `/dashboard/messages`, várias linhas com tipo `TEXT` exibem `—` (conteúdo vazio).
- Algumas mensagens aparecem como `UNKNOWN` sem texto.
- Uma mensagem simples (`Oi boa tarde`) extrai corretamente — padrão intermitente.

## Fluxo atual

```
Baileys messages.upsert
  → mapBaileysMessage (baileys-message.util.ts)
  → StoreWhatsappMessageUseCase → Prisma
  → GET /api/whatsapp/messages → UI
```

O mapeador lê apenas campos **no topo** de `raw.message`:

- `conversation`
- `extendedTextMessage.text`
- `imageMessage.caption`
- `documentMessage.caption` / `fileName`

## Causa raiz

O protocolo WhatsApp envia muitas mensagens **encapsuladas**. O Baileys expõe `normalizeMessageContent` / `extractMessageContent` em `Utils/messages.js` para desembrulhar:

| Wrapper | Conteúdo real |
|---------|----------------|
| `ephemeralMessage.message` | mensagem temporária |
| `viewOnceMessage.message` | visualização única |
| `viewOnceMessageV2` / `V2Extension` | visualização única v2 |
| `editedMessage.message` | mensagem editada |
| `documentWithCaptionMessage.message` | documento com legenda |

Nosso código **não desembrulha** antes de extrair. O tipo pode ser detectado como `TEXT` (ex.: `extendedTextMessage` vazio no envelope) ou `UNKNOWN` (só o wrapper visível), com `content` vazio.

Chats `@lid` (Linked ID) não são a causa — o payload interno segue o mesmo formato.

## Correção planejada

1. Desembrulhar `raw.message` (mesma lógica do Baileys, até 5 níveis).
2. Tratar respostas interativas: `buttonsResponseMessage`, `listResponseMessage`.
3. Detectar `TEXT` apenas quando há texto real (`conversation` ou `extendedTextMessage.text` não vazio).
4. Testes unitários para wrappers e respostas de botão/lista.

## Arquivos afetados

- `packages/whatsapp/src/utils/baileys-message.util.ts`
- `packages/whatsapp/src/utils/baileys-message.util.test.ts`

## Limitação

Mensagens já persistidas com `content` vazio **não são reprocessadas** automaticamente (raw payload não é armazenado).
