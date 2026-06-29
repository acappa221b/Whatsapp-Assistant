# RC-12 — Matriz de testes

| Área | Comando / harness |
|------|-------------------|
| Transcrição | `TranscribeAudioUseCase` unit + Rc12MultimodalHarness |
| Foto / vision | `ProcessPhotoUseCase` + agent pipeline events |
| Agent multimodal | `process-agent-auto-reply.use-case.test.ts` |
| Report job | `daily-report.job.ts` — `reportAutoTime` |
| Settings API | providers GET mascara `apiKey` |
| Assistant broadcast | `assistant-service` — só `archiveEnabled` |
| Factory | `packages/ai/src/providers/factory.ts` |
| Integração | `pnpm db:migrate`, `pnpm test:unit`, `pnpm typecheck`, `pnpm harness`, `pnpm build` |
