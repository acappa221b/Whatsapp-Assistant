# Media Storage

Arquivos de mídia são armazenados em `MEDIA_STORAGE_PATH` (padrão: `storage/media/`).

## Estrutura por chat (RC-09)

```
storage/media/{chatDir}/
  messages/   # textos exportados, transcrições futuras (.txt/.json)
  photos/     # imagens (jpg, png, webp)
  reports/    # PDFs e relatórios
  audio/      # áudios brutos (.ogg) — Whisper futuro
```

`{chatDir}` = slug do nome + sufixo do chatId (ex.: `ferramentaria-apcom_2276062`).

Persistido em `WhatsappChatConfig.storageDir`.

## Componentes

- `ChatMediaStorage` (`@finance-ai/shared/storage`)
- `MediaDownloader` — salva em `{chatDir}/photos/` ou `reports/`
- preview/download via rotas da dashboard (path relativo ao media root)

## Delete

`DeleteChatHistoryUseCase` remove pasta `{chatDir}/` recursivamente + mensagens no DB.

## Reset

```bash
pnpm rc:09:reset-all-history          # dry-run
pnpm rc:09:reset-all-history --confirm
```
