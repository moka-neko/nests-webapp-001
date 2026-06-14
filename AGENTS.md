# AGENTS.md

## Cursor Cloud specific instructions

### What this is
NestJS 11 REST API (`nest-api-project-01`) for managing teacher/student applications (塾 応募管理 API). There is no frontend; the only UI is the auto-generated Swagger page at `http://localhost:3000/api`. Standard scripts live in `package.json` (`start:dev`, `build`, `lint`, `test`, `test:e2e`).

### Database / Prisma (non-obvious)
- Persistence is SQLite via the Prisma 7 libsql adapter. `src/prisma/prisma.service.ts` defaults `DATABASE_URL` to `file:./dev.db`, and `dev.db` is committed with the schema already migrated. So the app and tests run with **no `.env` required**.
- `prisma.config.ts` reads `process.env.DATABASE_URL`, so any Prisma CLI command that touches the datasource (e.g. `npx prisma migrate status`, `migrate dev`) fails with "datasource.url property is required" unless you export it first: `DATABASE_URL=file:./dev.db npx prisma ...`.
- `npx prisma generate` does not need `DATABASE_URL`.

### Lint (non-obvious)
- `npm run lint` runs `eslint ... --fix`, which **rewrites committed source files** (the repo ships with a few pre-existing prettier formatting violations). It exits 0 because it auto-fixes. If you only want to check, run `npx eslint "{src,test}/**/*.ts"` (no `--fix`) and discard any `--fix` edits you don't intend to commit.

### Tests (non-obvious)
- `npm run test:e2e` passes. `npm test` (unit) has **pre-existing failures**: several scaffold `*.spec.ts` files build a `TestingModule` with services that depend on `PrismaService` without providing it. These failures are unrelated to environment setup.

### Running
- Dev server: `npm run start:dev` (watch mode) on port 3000. Swagger UI at `/api`. Example smoke test: `POST /api/v1/teachers/applications` then `GET /api/v1/teachers/applications`.
- Frontend apps live under `apps/`:
  - **API**: `npm run dev:api` (port 3000)
  - **管理画面** (`apps/admin`, Vite + React): `npm run dev:admin` (port 5173). Set `VITE_API_BASE_URL=http://localhost:3000` in `apps/admin/.env`.
  - **公開サイト** (`apps/public`, Next.js): `npm run dev:public` (port 3001). Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` in `apps/public/.env`.
- Build all: `npm run build:all`
