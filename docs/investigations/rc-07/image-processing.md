# RC-07 — Image Processing Stages

| Etapa | Log | Perda de texto? |
|-------|-----|-----------------|
| Classificação | `[RC07/PARSER]` | Sim se sem caption → `[image]` |
| Download | `[RC-06F/image]` download_* | Não afeta content |
| OpenAI vision | `[RC-06F/image]` extract_* | Grava em Extraction, não content |
| UI preview | `resolveMessagePreview` | Mostra `[imagem]` para `[image]` |

## Diagnóstico

- `imagesWithCaption` vs `imagesWithoutCaption` em `/api/whatsapp/fidelity`
- `wrappersEncountered` em `/api/whatsapp/archive/health`

OCR genérico: **não implementado** nesta RC.
