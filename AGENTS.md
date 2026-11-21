# AGENTS.md

## Cursor Cloud specific instructions

### What this is
Application management system for 友達先生日本語会話教室 (teacher / student applications, 応募管理), migrated from Google Apps Script (`regacy_gas/`). npm workspaces with three apps:

| Path | App | Port | Dev command |
| --- | --- | --- | --- |
| `src/` | NestJS 11 REST API (`nest-api-project-01`), Swagger UI at `/api` | 3000 | `npm run dev:api` (= `start:dev`) |
| `apps/admin` | 管理画面 (Vite + React) | 5173 | `npm run dev:admin` |
| `apps/public` | 公開サイト / application forms (Next.js, static export) | 3001 | `npm run dev:public` |

- Admin needs `VITE_API_BASE_URL=http://localhost:3000` in `apps/admin/.env`; public needs `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` in `apps/public/.env`. Both default to `http://localhost:3000` when unset.
- Build all: `npm run build:all`.
- Design docs: `docs/detailed-design.md`, `docs/screen-design.md`. Deployment: `docs/deployment-aws-supabase.md`. Google Meet setup: `docs/google-meet-setup.md`.

### Database / Prisma (non-obvious)
- Persistence is **PostgreSQL** (Supabase in dev/prod) via Prisma 7 and `@prisma/adapter-pg`. `src/prisma/prisma.service.ts` throws at startup unless `DATABASE_URL` (or `DIRECT_URL`) is set, so the API and the e2e tests **need a running Postgres**. Copy `.env.example` to `.env` (loaded by `prisma.config.ts` via `dotenv`) or export the variables.
- `prisma.config.ts` uses `DIRECT_URL ?? DATABASE_URL` for CLI commands (`migrate deploy`, `migrate diff`, ...). `npx prisma generate` needs neither.
- Local Postgres example (matches CI): `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_test postgres:16`, then `export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_test DIRECT_URL=postgresql://postgres:postgres@localhost:5432/app_test && npx prisma migrate deploy` (spell out both values: `DIRECT_URL=$DATABASE_URL` on the same line expands to an empty string).
- New schema changes need a hand-written or generated SQL migration under `prisma/migrations/`. Check drift with `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` (should print an empty migration).
- `dev.db` (and a stray empty `dev.db\r`) are leftovers from the earlier SQLite setup and are not used by the code.
- On first start the API creates the initial admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`.

### External services (all optional locally)
- LINE (`LINE_*`), SMTP mail (`MAIL_*`) and Google Meet (`GOOGLE_*`) are skipped when unconfigured: the services log `[LINE skipped]` / `[Mail skipped]` instead of sending. Google Meet issuance returns 400 and the admin UI falls back to entering the meeting URL manually.
- Weekly interview reminder: `POST /api/v1/jobs/weekly-interview-reminder` with header `x-cron-secret: $CRON_SECRET` (`?force=true` resends in the same week). It is not scheduled in-process; on the dev AWS account it is triggered by the EventBridge stack in `infra/dev/weekly-interview-reminder.yml`, deployed by the `deploy-scheduler` job in `.github/workflows/deploy.yml` (needs the `DEV_CRON_SECRET` secret and the extra OIDC role permissions in `infra/dev/github-oidc-scheduler-policy.json`). Validate the template with `cfn-lint`.

### Lint (non-obvious)
- `npm run lint` runs `eslint ... --fix`, which **rewrites committed source files** (the repo has pre-existing prettier violations). To only check, run `npx eslint "{src,test}/**/*.ts"` without `--fix`, or lint just the files you changed.
- The root `tsconfig.json` also matches `apps/`; type-check the API with `npx tsc --noEmit -p tsconfig.build.json` and the admin app with `cd apps/admin && npx tsc -b`.
- `apps/admin` has two pre-existing `react-hooks/set-state-in-effect` errors (`StudentEditPage`, `TeacherEditPage`).

### Tests (non-obvious)
- `npm test` (unit, `src/**/*.spec.ts`) mocks Prisma and external services and runs without a database.
- `npm run test:e2e` boots the full `AppModule`, so it needs Postgres with migrations applied (see above). CI runs it against a `postgres:16` service container.

### Running / smoke test
- Swagger UI at `http://localhost:3000/api`. Example: `POST /api/v1/teachers/applications` then log in via `POST /api/v1/admin/login` and call `GET /api/v1/teachers/applications` with the bearer token.
- Admin pages of note: `/interviews?week=YYYY-MM-DD` (面接日程調整, the link sent by the Monday reminder) and `/teachers/:id` (Google Meet URL issuance). Unauthenticated visits are redirected to `/login` and return to the original URL after login.
