# Módulo Relatórios — Spec (Fase 2)

**Epic:** Assistant-01 (spec) / Assistant-02 (implementação proposta)  
**Status:** SPEC ONLY — **NÃO IMPLEMENTAR** nesta fase

---

## Objetivo futuro

Gerar **relatórios diários automáticos** a partir do arquivo de mensagens e transcrições, com retenção **permanente**.

## Tipos de relatório (v1 futuro)

| Tipo | Descrição |
|------|-----------|
| Resumo do dia | Total mensagens, top chats, highlights |
| Resumo por usuário | Atividade de um participante |
| Resumo por grupo | Atividade de um grupo |
| Resumo personalizado | Ex.: "esposa", "trabalho" (filtro por chat/tag) |

## Modelo proposto

```prisma
model DailyReport {
  id          String   @id @default(cuid())
  reportDate  DateTime @db.Date
  type        String   // DAILY_SUMMARY | USER | GROUP | CUSTOM
  scopeId     String?  // chatId or participantId
  title       String
  content     String   // Markdown ou JSON structured
  generatedAt DateTime @default(now())

  @@unique([reportDate, type, scopeId])
  @@index([reportDate])
}
```

## Regras

1. Relatórios **nunca** expiram (diferente de mensagens 60d)
2. Geração via job cron (ex.: 23:59 daily)
3. Nesta fase: UI `/dashboard/reports` exibe placeholder "Em breve"
4. IA para síntese: Fase 3 (fora Assistant-01)

## UI placeholder (Assistant-01)

- Rota `/dashboard/reports` mantida no menu
- Conteúdo: card explicando spec + link para este documento
- Sem API de geração

## Critérios de aceite (somente placeholder)

**Given** usuário abre Relatórios  
**When** Fase 1 ativa  
**Then** vê mensagem "Módulo em desenvolvimento — spec disponível"

## Referências

- [docs/product/vision.md](../../docs/product/vision.md) — retenção permanente
- Implementação: após conclusão Assistant-01 Message Archive
