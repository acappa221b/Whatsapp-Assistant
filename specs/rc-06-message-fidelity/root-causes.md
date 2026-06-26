# RC-06 Message Fidelity — Root Causes

## RC-06F-01 — Chat list shows own name

**Cause:** `pushName` on outbound (`fromMe`) messages is the authenticated user's display name. It was stored on `chatId` and used as `chatName` for DMs.

**Fix:** Never derive DM `chatName` from `pushName` when `fromMe`. Use contact cache / incoming `senderName` only.

## RC-06F-02 — TEXT shows "Mensagem de texto"

**Cause A:** DB `content` empty for TEXT (classifier gap or historical data).  
**Cause B:** `resolveMessagePreview` fallback masks empty content in API/UI.

**Fix:** Expand classifier; backfill from `rawPayload`; preview only when content truly absent.

## RC-06F-03 — Images show [imagem] only

**Cause A:** No caption on image → classifier stores `[image]`.  
**Cause B:** Vision pipeline extracts **financial candidates**, not OCR text back to `WhatsappMessage.content`.  
**Cause C:** Download/OCR failures not logged measurably.

**Fix:** Document pipeline; structured `[RC-06F/image]` logs; fidelity metrics count caption vs extraction.
