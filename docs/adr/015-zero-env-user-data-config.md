# ADR-015: Zero-env architecture and user-local data

**Status:** Accepted  
**Date:** 2025-06-26  
**Version:** 1.4.0-rc14

## Context

The project required open-source plug-and-play: clone from GitHub, run launcher, configure via dashboard. Storing secrets in `.env` blocked non-technical users and leaked configuration patterns into documentation.

## Decision

1. **No `.env` file** — the application never reads `.env` from disk.
2. **Defaults in code** — `APP_DEFAULTS` in `packages/shared/src/config/app.defaults.ts`.
3. **User config in SQLite** — `AppSettings` holds app name, port, paths, WhatsApp flags, setup wizard state.
4. **Secrets in DB** — API keys in encrypted `AiProviderConfig`; `settingsEncryptionSecret` generated on first boot via `bootstrapAppSettings()`.
5. **CI/test overrides only** — `process.env` limited to `NODE_ENV`, `PORT`, `DATABASE_URL`, `CI`, `TZ`, `DOCKER_BUILD`.
6. **Local data outside Git** — `storage/`, `*.db`, `backups/`, `logs/` gitignored.

## Consequences

- Positive: zero-config clone experience; secrets not in repo; single settings UI.
- Negative: port changes require restart; Docker must pass minimal build env vars.
- Migration: existing `.env` on developer machines is ignored; re-enter API keys in Settings.

## Related

- Spec: `specs/rc-14-oss-zero-config-messages-ui/`
- Bootstrap: `apps/dashboard/src/lib/bootstrap/app-settings.ts`
