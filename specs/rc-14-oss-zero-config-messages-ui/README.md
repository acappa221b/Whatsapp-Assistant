# RC-14 — Mensagens estilo WhatsApp + Open Source zero-config + Launcher

**Versão:** 1.4.0-rc14  
**Status:** Implementado

## Objetivo

Transformar o projeto em experiência plug-and-play open source: UI de mensagens estilo WhatsApp, layout viewport-locked, configuração 100% no dashboard (sem `.env`), launcher cross-platform.

## Escopo

### Parte 1 — UI Mensagens
- Layout `h-screen` no dashboard; painéis com scroll independente
- Bolhas esquerda/direita (`fromMe`)
- Auto-scroll com stick-to-bottom
- Composer + `POST /api/whatsapp/chats/[chatId]/send`
- Scrollbar `.wa-scroll` visível

### Parte 2 — Zero `.env`
- Remover `.env.example` e leitura de `.env` do disco
- `APP_DEFAULTS` + `AppSettings` no SQLite
- Encryption secret gerado no 1º boot
- API keys só em `AiProviderConfig` criptografado

### Parte 3 — Open Source
- README “Começar em 2 minutos”
- LICENSE MIT, CONTRIBUTING.md
- Dados locais em `storage/`, `*.db`, `backups/`

### Parte 4 — Launcher
- `scripts/launch.mjs`, `.bat`, `.command`
- `pnpm launch`

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-M01 | Dashboard não rola a página inteira |
| AC-M02 | Lista de chats rola com scrollbar |
| AC-M03 | Chat rola; auto-scroll ao abrir/trocar |
| AC-M04 | Bolhas conforme `fromMe` |
| AC-M05 | Composer envia mensagem real |
| AC-M06 | Polling mantém scroll no fim se usuário estava no fim |
| AC-E01 | `.env.example` deletado |
| AC-E02 | App inicia sem `.env` |
| AC-E03 | Sem `OPENAI_API_KEY` no env schema |
| AC-E04 | Encryption secret auto-gerado |
| AC-E05 | README sem copiar `.env` |
| AC-L01 | Launcher instala deps e abre browser |
| AC-L02 | Funciona com só Node 20+ |
| AC-L03 | `pnpm launch` cross-platform |

## ADR

[ADR-015](../../docs/adr/015-zero-env-user-data-config.md)
