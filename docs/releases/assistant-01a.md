# Release — Assistant-01A

**Versão:** 1.0.1-assistant-01a  
**Data:** 2025-06-25  
**Tipo:** Rebranding + UI (sem backend)

---

## Resumo

Primeira entrega do pivot **WhatsApp Assistant**: identidade visual, sidebar neon, menu simplificado, Sumário com placeholders e redirect automático.

## Alterações

### UI

- Tema escuro com acentos neon (laranja, rosa, verde)
- Sidebar lateral esquerda (`AppSidebar`)
- Menu: Dashboard · Mensagens · WhatsApp · Relatórios
- `/` → redirect `/dashboard`
- Dashboard renomeado para **Sumário** (6 widgets mock)
- Relatórios: placeholder "Módulo em desenvolvimento"

### Config / branding

- `APP_NAME` → WhatsApp Assistant
- Metadata Next.js atualizada
- `.env.example` versão 1.0.1-assistant-01a

### Não alterado

- Prisma / SQLite
- Baileys / WhatsApp runtime
- APIs / pipelines / Event Bus
- Páginas deprecated (ainda acessíveis por URL direta)

## Arquivos principais

| Ação | Path |
|------|------|
| Criado | `apps/dashboard/src/components/layout/app-sidebar.tsx` |
| Criado | `specs/assistant-01a/` |
| Criado | `harness/assistant-01a/` |
| Alterado | `apps/dashboard/src/app/dashboard/layout.tsx` |
| Alterado | `apps/dashboard/src/app/dashboard/page.tsx` |
| Alterado | `apps/dashboard/src/app/dashboard/reports/page.tsx` |
| Alterado | `apps/dashboard/src/app/page.tsx` |
| Alterado | `apps/dashboard/src/app/layout.tsx` |
| Alterado | `apps/dashboard/src/app/globals.css` |
| Alterado | `apps/dashboard/tailwind.config.ts` |
| Alterado | `apps/dashboard/e2e/dashboard.spec.ts` |

## Validação manual

```bash
pnpm dev
# Abrir http://localhost:4000 → deve ir para /dashboard
# Sidebar: 4 itens
# Título: Sumário
# /dashboard/reports → Módulo em desenvolvimento
# /dashboard/pipeline → ainda funciona (sem link na nav)
```

```bash
pnpm harness
pnpm test:unit
pnpm test:e2e
```

## Screenshots

Capturas em `docs/releases/screenshots/`:

- `assistant-01a-dashboard.png` — Sumário + sidebar neon
- `assistant-01a-reports.png` — placeholder Relatórios
- `assistant-01a-whatsapp.png` — página WhatsApp (nav lateral)

Regenerar: `node scripts/capture-assistant-01a-screenshots.mjs` (dev server em `:4000`)

## Próximo

**Assistant-01B** — Message Archive (não iniciar até aprovação).
