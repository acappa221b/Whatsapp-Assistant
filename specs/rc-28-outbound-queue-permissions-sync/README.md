# RC-28 — Outbound queue + Permissions sync progress

**Version:** `1.7.3-rc28`

## Part A — Message send queue

- `use-message-send-queue.ts` — per-chatId FIFO worker, optimistic UI
- `outbound-message-bubble.tsx` — queued / sending / failed states
- `message-archive-view.tsx` — composer clears immediately on ENTER

## Part B — Contact sync tracker

- `contact-sync-tracker.ts` — global snapshot in `globalThis`
- `GET /api/whatsapp/sync-status` — snapshot + `connected`
- Runtime hooks: bootstrap, history, chats/contacts/groups/message discovery
- `onHistorySyncProgress` in Baileys factory

## Part C — Permissions UI

- `contact-sync-banner.tsx` — polls sync status every 2s
- Auto-refresh table when `processed` increases (debounce 1s)

## Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-01 | ENTER sends and clears textarea immediately |
| AC-02 | 3 rapid messages queue in order per chat |
| AC-03 | Optimistic bubble while queued/sending |
| AC-04 | Network failure → failed bubble + retry |
| AC-05 | Permissions banner shows sync after connect |
| AC-06 | Recent sync list updates live |
| AC-07 | Completed banner or zero-contact message |
| AC-08 | `Contato sincronizado` in Logs |
| AC-09 | Permissions table refreshes on new chat |
