# Release RC-17 — AI Training Module

**Versão:** 1.5.0-rc17 (MINOR)

## Novidades

- Aba **IA** em Configurações
- Persona: modo pessoal/empresa, presets, sliders, exemplos
- Base de conhecimento: upload Excel/CSV/texto/imagem
- Simulador de resposta antes de usar no WhatsApp
- Auto-reply e Chat IA usam prompt composto (persona + KB + estilo)

## Migração

```bash
pnpm db:migrate && pnpm db:generate
```

## Template

Baixe o modelo em Configurações → IA ou em `/templates/catalogo-precos.xlsx`.

## Limitações v1

- Busca por palavras-chave (sem embeddings)
- Persona global apenas (override por chat = v1.1)
