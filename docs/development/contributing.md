# Contributing Guide

## Conventional Commits

Todos os commits devem seguir o padrão:

```
<type>(<scope opcional>): <descrição>
```

### Types permitidos

| Type | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição ou alteração de testes |
| `docs` | Documentação |
| `spec` | Especificações SDD |
| `harness` | Agentes de validação |
| `chore` | Manutenção, deps, CI |

### Exemplos

```
feat(expense): add create expense use case
fix(dashboard): correct KPI total calculation
spec(epic-02): define expense domain test cases
harness: validate shared package in architecture harness
docs: update ADR-004 soft delete policy
chore: bump vitest to 2.1.9
```

## Husky + Commitlint

Após `pnpm install`, o hook `commit-msg` valida automaticamente:

- Type obrigatório e da lista permitida
- Subject não vazio
- Header máximo 100 caracteres

Configuração: `commitlint.config.js`

## Fluxo SDD

1. Escrever/atualizar spec em `specs/epic-XX/`
2. Documentar casos de teste
3. Implementar (se spec aprovada)
4. Rodar `pnpm test:coverage` e `pnpm harness`
5. Atualizar README e docs

## Checklist antes de PR

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test:coverage` (gate 90%)
- [ ] `pnpm harness`
- [ ] `pnpm build`
- [ ] README/docs atualizados se necessário

## Branches

- `main` / `master` — estável
- `develop` — integração
- `feature/epic-XX-*` — trabalho por epic
