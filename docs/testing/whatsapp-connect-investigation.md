# RC-01 — Investigação WhatsApp Connect

Data: 2026-06-24

## Sintoma

`POST /api/whatsapp/connect` retornava `500` durante a validação manual da RC v0.1.

## Hipóteses avaliadas

| Hipótese | Resultado |
|---|---|
| Erro de banco / schema | **Parcial** — bloqueava outras APIs; não era a causa direta do connect após DB corrigido |
| Erro de config (`OPENAI_API_KEY`) | **Parcial** — impedia registro do pipeline em rotas que importavam runtime completo |
| Erro de storage / sessão | **Secundário** — tratamento de sessão corrompida implementado em `BaileysWhatsappProvider` |
| Erro de SSE | Não investigado nesta rodada (connect falhava antes do SSE) |
| Erro de provider Baileys | **Causa raiz do connect** |

## Causa raiz

1. **API Baileys incorreta no factory:** `baileys-socket.factory.ts` usava `socket.on(...)`, mas Baileys v6 expõe eventos via `socket.ev.on(...)`.
2. **Bundling no Next dev:** import dinâmico ESM de `@whiskeysockets/baileys` retornava objeto incompatível; corrigido com `createRequire` para carregar o pacote como external Node.
3. **Dependência indireta do pipeline:** rotas de mensagens registravam pipeline + OpenAI antes de listar dados; relaxada validação de `OPENAI_API_KEY` fora de `production` e removido registro desnecessário na listagem.

## Stack trace observado (pré-correção)

```
TypeError: socket.on is not a function
  at createDefaultBaileysSocket (baileys-socket.factory.ts)
  at BaileysWhatsappProvider.connect
  at POST /api/whatsapp/connect
```

## Correções aplicadas

- `packages/whatsapp/src/providers/baileys-socket.factory.ts`
  - `createRequire('@whiskeysockets/baileys')`
  - listeners em `socket.ev.on`
- `packages/whatsapp/src/providers/baileys.provider.ts`
  - sessão corrompida: reset automático + retry
  - caminhos absolutos de sessão via config
- `apps/dashboard/src/app/api/whatsapp/connect/route.ts`
  - logging estruturado de erro
  - resposta JSON com `qrCodeDataUrl` quando disponível

## Evidência pós-correção

```
POST /api/whatsapp/connect → 200
{"ok":true,"status":"connecting","qrCodeDataUrl":null}
```

O QR é emitido de forma assíncrona pelo evento `connection.update`; o dashboard deve escutar `/api/whatsapp/events` ou polling em `/api/whatsapp/status` para exibir o QR quando `status = "qr"`.

## Pendências

- Validar conexão com aparelho físico (fora do escopo automatizado desta sessão).
- Confirmar persistência de sessão após restart com credenciais reais salvas em `storage/whatsapp`.
