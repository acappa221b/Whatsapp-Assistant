# RC-05 — Test Matrix

| ID | Área | Caso | Camada |
|----|------|------|--------|
| RC05-T01 | Runtime | integrity check detecta use case ausente | unit |
| RC05-T02 | Runtime | rebuild invalida pipelines flag | unit |
| RC05-T03 | API | archive/chats retorna 200 | integration |
| RC05-T04 | API | messages filtra chatId A vs B | unit/integration |
| RC05-T05 | Repository | findMany where chatId | unit |
| RC05-T06 | UI | error state quando !response.ok | component |
| RC05-T07 | UI | empty state quando items=[] | component |
| RC05-T08 | Harness | RuntimeHarness | harness |
| RC05-T09 | Harness | ArchiveApiHarness | harness |
| RC05-T10 | Diagnostic | pnpm rc:05:diagnostic PASS | script |
