# Assistant-01A — Rebranding e Simplificação Visual

**Status:** Implementado  
**Versão:** 1.0.1-assistant-01a  
**Tipo:** UI / branding only — sem backend

---

## Objetivo

Reposicionar visualmente o produto de Finance AI Dashboard para **WhatsApp Assistant**: tema escuro neon, sidebar lateral, menu simplificado, Sumário com placeholders, redirect `/` → `/dashboard`.

## Escopo IN

- Rebranding (APP_NAME, metadata, sidebar, header)
- Tema escuro estilo Cursor/TRON (neon leve)
- Sidebar esquerda com 4 itens
- Redirect raiz
- Dashboard → Sumário (mock widgets)
- Relatórios placeholder
- Spec + harness + docs

## Escopo OUT

- Baileys, runtime, Event Bus, Prisma, APIs, pipelines
- Remoção de páginas deprecated
- Widgets com dados reais
- Whisper, Message Archive (Assistant-01B+)

---

## Fases

| Fase | Entregável |
|------|------------|
| 1 | Identidade WhatsApp Assistant + tema neon |
| 2 | Redirect `/` → `/dashboard` |
| 3 | Menu 4 itens (ocultar deprecated) |
| 4 | Sumário + 6 placeholders |
| 5 | Relatórios placeholder |
| 6 | Documentação |
| 7–8 | Spec + harness |

---

## Artefatos

- [test-matrix.md](./test-matrix.md)
- [acceptance-criteria.md](./acceptance-criteria.md)

## Referências

- [docs/releases/assistant-01a.md](../../docs/releases/assistant-01a.md)
- [Epic Assistant-01](../epic-assistant-01/README.md)
