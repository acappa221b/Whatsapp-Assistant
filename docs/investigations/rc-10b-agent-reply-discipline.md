# RC-10B — Investigação: disciplina de resposta

## Sintoma (exemplo real)

```
Alexandre: e ai, como está o dispositivo passa/não passa? conseguiram liberar?
Thiago: Estou finalizando
IA: "beleza, avisa quando finalizar?" ← OK (1ª vez)
Thiago: Só um ajuste fino mesmo.
IA: "beleza, avisa quando finalizar?" ← ERRADO (repetição)
Thiago: Boaaa
IA: "Boa! Quase lá, já te aviso." ← ERRADO (não precisava)
```

## Causa

RC-10 não tinha skip, deduplicação nem filtro anti-convite.

## Fix

- `shouldSkipBeforeLLM` antes da OpenAI
- `action: skip` no schema
- `AgentReplyDeduplicator` + `sanitizeAgentReply`
