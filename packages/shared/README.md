# @finance-ai/shared

Pacote de **compartilhamento técnico** entre apps e packages do monorepo.

## Responsabilidades

| Pasta | Conteúdo permitido |
|-------|-------------------|
| `types/` | Tipos utilitários genéricos (`Result`, `Nullable`) |
| `errors/` | Classes de erro de infraestrutura |
| `constants/` | Constantes técnicas (nome do app, versão) |
| `utils/` | Funções puras sem regra de negócio |
| `contracts/` | Interfaces/contratos compartilhados entre pacotes |

## O que NÃO pertence aqui

- Regras de negócio financeiras
- Entidades de domínio (Expense, Revenue, etc.)
- Lógica de aprovação, IA ou WhatsApp
- Acesso a banco de dados

Use `@finance-ai/core` para domínios e `@finance-ai/shared` apenas para código técnico reutilizável.

## Dependências

- **Pode ser importado por:** qualquer app ou package
- **Não deve importar:** `@finance-ai/core`, `@finance-ai/database`, ou pacotes de domínio
- **Objetivo:** evitar crescimento indevido do `core` e dependências circulares

## Exemplo

```typescript
import { APP_NAME } from '@finance-ai/shared/constants'
import { InfrastructureError } from '@finance-ai/shared/errors'
import type { Result } from '@finance-ai/shared/types'
```
