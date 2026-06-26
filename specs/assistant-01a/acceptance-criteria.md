# Assistant-01A — Critérios de Aceite

## AC-01 Redirect

**Given** usuário acessa `http://localhost:4000/`  
**When** a página carrega  
**Then** URL é `/dashboard` (redirect automático)

## AC-02 Menu

**Given** usuário está em qualquer página do dashboard  
**When** observa a sidebar  
**Then** vê exatamente: Dashboard, Mensagens, WhatsApp, Relatórios  
**And** não vê: Pipeline, Extrações, Despesas, Aprovações, Configurações

## AC-03 Rotas legacy

**Given** rotas deprecated existem no filesystem  
**When** usuário acessa `/dashboard/pipeline` diretamente  
**Then** página ainda carrega (sem link na nav)

## AC-04 Sumário

**Given** usuário abre `/dashboard`  
**When** página renderiza  
**Then** título principal é **Sumário**  
**And** exibe 6 cards placeholder (mock)

## AC-05 Relatórios

**Given** usuário abre `/dashboard/reports`  
**When** página renderiza  
**Then** exibe **Módulo em desenvolvimento**  
**And** não chama API

## AC-06 Sem backend

**Given** Assistant-01A concluído  
**When** revisa diff  
**Then** nenhum arquivo em `prisma/`, `packages/whatsapp/`, `api/` alterado (exceto se acidental — proibido)

## AC-07 Identidade

**Given** inspeção de código  
**When** busca APP_NAME  
**Then** valor é `WhatsApp Assistant`

## AC-08 Testes

**Given** CI local  
**When** `pnpm harness && pnpm test:unit`  
**Then** todos passam
