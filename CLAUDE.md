# AITO / Alto — Claude Code workspace notes

## Runtime

- **Node**: 23 (project requires `>=20.0.0`; user keeps Node 23 via nvm).
  - If you see `Unsupported engine` warnings, run `nvm use 23` before any pnpm command.
  - Default node from `nvm alias default 23` (set 2026-05-20).
- **pnpm**: 9.15.0 (workspace package manager — do NOT use npm/yarn).

## Project path: ASCII only

This repo lives at `~/Projects/aito`. Do **not** move it back to a path that
contains spaces or non-ASCII (CJK) characters.

Hard incident on 2026-05-20: the project was originally at
`~/Desktop/NEW EIC/aito咨询平台/aito`. `next dev` would start, compile, then
hang silently when a request hit `/[locale]` — no error, just frozen requests.
Webpack/Next 15's response pipeline tripped on the non-ASCII path. Moving to
`~/Projects/aito` fixed it immediately.

If `pnpm web:dev` ever hangs after "Ready" with no errors, suspect the path
first.

## Shell-quoting trap (READ THIS)

Do **not** append trailing comment-like text to shell commands. Things like:

```
pnpm db:migrate "#" "应用" "Prisma" "迁移"
pnpm test "#" "16" "个单测应该全过"
```

…look like comments but `"#"` and the Chinese strings are valid quoted **positional
arguments**. They get passed through pnpm → `prisma migrate dev` / `vitest run` /
`docker-compose up`, and break the commands silently or noisily. Either put the
note on its own line as `# …` or omit it.

## Database (local dev)

- Postgres runs in Docker: `pnpm db:up` (container `aito-alto-postgres`, port 5432).
- Env file: `packages/database/.env` (NOT the root `.env` — Prisma reads the
  package-local one). Template at `packages/database/.env.example`.
- Migrations live in `packages/database/prisma/migrations/`.
  - History so far (2026-05-20):
    - `20260520043156_init` — generated baseline from `schema.prisma`.
    - `20260520043200_partial_unique_active_subscription` — manual SQL for the
      partial unique index on active subscriptions (formerly dated `20260510...`,
      renamed so it applies AFTER `init`).

## Common commands (run from repo root)

```
pnpm db:up          # start local postgres container
pnpm db:migrate     # prisma migrate dev (no extra args!)
pnpm db:seed        # seed sample data
pnpm db:studio      # prisma studio
pnpm web:dev        # next.js app
pnpm test           # turbo run test (all packages)
```
