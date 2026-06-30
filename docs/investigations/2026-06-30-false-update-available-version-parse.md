# Investigação: banner falso de atualização (parse versão)

**Data:** 2026-06-30  
**Release:** RC-24

## Sintoma

App em `v1.6.1-rc18b` mostrava banner "Nova versão **1.5.3-rc21** disponível" — remoto **mais antigo** que o local.

## Causa raiz

`parseVersion()` usava regex `/-rc(\d+)$/` sem sufixo alfabético.

| Versão | Parse antigo | Resultado |
|--------|--------------|-----------|
| `1.6.1-rc18b` | ❌ não casa | `{0,0,0}` |
| `1.5.3-rc21` | ✅ | `{1,5,3, rc:21}` |

Comparação: `1.5.3 > 0.0.0` → falso positivo de update.

Mesma lógica duplicada em `scripts/update/lib/compare-update.mjs`.

## Correção

- Parser estendido: `-rcNN`, `-rcNNa/b`, tags `-dev`
- Parse inválido → `null` (nunca `0.0.0` silencioso)
- `isNewerVersion` retorna `false` se não puder comparar
- Launcher importa `compare-versions.mjs` compartilhado
- Cache invalida quando `localVersion` muda

## Reprodução (antes do fix)

```typescript
isNewerVersion('1.5.3-rc21', '1.6.1-rc18b') // true (ERRADO)
```

## Após fix

```typescript
isNewerVersion('1.5.3-rc21', '1.6.1-rc18b') // false
isNewerVersion('1.6.2-rc24', '1.6.1-rc18b') // true
```
