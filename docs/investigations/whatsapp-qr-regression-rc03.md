# WhatsApp QR regression (pós RC-03)

## Sintomas

- Clicar em **Conectar** ou **Nova sessão (QR)** não exibia QR code
- `POST /api/whatsapp/connect` e `POST /api/whatsapp/reset-session` retornavam **500**
- Status ficava em `connecting` com `qrCodeDataUrl: null`

## Causa raiz

1. **`instrumentation.ts`** importava o runtime WhatsApp no boot do Next.js, forçando o webpack a empacotar Baileys/sharp/`node:fs` e quebrando a compilação do servidor.
2. **`createRequire()`** no pacote `@finance-ai/whatsapp` (transpilado pelo Next) era substituído pelo webpack — `require` deixava de funcionar.
3. Import dinâmico de Baileys sem `webpackIgnore` puxava **sharp** para o bundle; com `webpackIgnore` mas path relativo, a resolução falhava no monorepo pnpm.
4. Export CJS de Baileys expõe **`makeWASocket`** (named), não `default` — destructuring `default: makeWASocket` falhava após import ESM.

## Correção

| Mudança | Arquivo |
|---------|---------|
| Removido bootstrap via instrumentation | `apps/dashboard/src/instrumentation.ts` (deletado) |
| Bootstrap lazy na 1ª request WhatsApp | `ensureWhatsappReady()` em `runtime.ts` |
| Resolução pnpm + import `file://` | `baileys-socket.factory.ts` |
| `webpackIgnore` + externals | `next.config.ts` |
| Registry de mídia isolado (sem Baileys no barrel) | `media-registry.ts` |
| Destructuring `makeWASocket` named export | `baileys-socket.factory.ts` |

## Verificação

```powershell
Invoke-RestMethod http://localhost:4000/api/whatsapp/reset-session -Method POST
# status=qr, qrCodeDataUrl presente (~6k chars)
```

## Limitação conhecida

Auto-connect com sessão válida ocorre na **primeira requisição** a qualquer rota `/api/whatsapp/*`, não mais no boot do `pnpm dev` (trade-off necessário para compatibilidade com webpack).
