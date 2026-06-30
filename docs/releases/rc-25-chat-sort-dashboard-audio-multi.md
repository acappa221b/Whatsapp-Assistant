# Release RC-25 — 1.7.0-rc25

## Novidades

- **Mensagens:** chats ordenados pela última mensagem (mais recente no topo).
- **Dashboard:** hover nos gráficos de tokens mostra tokens + custo estimado em R$ (4 casas decimais).
- **Chat IA:** uso de tokens registrado em `assistant_chat` e visível no dashboard.
- **Áudio:** com Áudio habilitado, mensagens só aparecem no chat após transcrição Whisper.
- **Multi Mensagem:** envio em massa para chats habilitados (~2s entre envios).

## Validação

```bash
pnpm test:unit && pnpm harness && pnpm build
```
