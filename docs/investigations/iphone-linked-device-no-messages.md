# iPhone / linked device — connected but no messages

## Summary

There is no iPhone-specific block in the codebase. Empty Permissions or Messages after a successful QR connection is usually caused by product behavior, not platform filtering.

## Root causes

1. **No old history by default** — Baileys runs with `syncFullHistory: false` unless **Importar historico recente ao conectar** is enabled in Configuracoes -> WhatsApp.
2. **Pipeline only ingests new traffic** — `messages.upsert` with `type: notify` is processed live. `type: append` (history batches) is ignored unless history import is ON.
3. **Permissions vs Messages** — chats are discovered into `WhatsappChatConfig`, but Messages only lists chats with `archiveEnabled = true`.
4. **Chat metadata may arrive before messages** — `messaging-history.set` and `chats.upsert` populate Permissions even when no message body exists yet.
5. **Session conflict (440)** — another WhatsApp Web session can connect briefly but stop receiving events. Check `operationalMessage` in status/diagnostics.

## How to test (iPhone or any phone)

1. Connect via QR in Configuracoes -> WhatsApp.
2. Wait until status is `connected`.
3. Send **teste** from the phone to any chat (or to yourself).
4. Within ~30s the chat should appear in **Permissoes**.
5. Enable **Habilitado** for that chat.
6. Open **Mensagens** — the test message should be visible.

## Diagnostics

- UI panel: Configuracoes -> WhatsApp (live count vs DB count, last event).
- API: `GET /api/whatsapp/diagnostics`
- Logs: server console `[RC-02/*]`, `[RC-16/chat-sync]`

## RC-16 changes

- `messaging-history.set` listener imports chat metadata on connect.
- `messages.upsert` respects Baileys `type` (`notify` vs `append`).
- Diagnostics API and empty-state banners explain expected behavior.
