# Yidak (يدك)

Shariah-compliant reverse-auction handyman marketplace for GCC countries.

## Prerequisites

- Node.js `22+`
- pnpm `9+`
- Supabase project (URL, anon key, service role key, DB URL)
- Stripe test keys (for payment flows)

Optional:

- Git
- PostgreSQL client

## 1) Clone and enter the repo

Run in: any parent folder where you want the project to live.

```bash
git clone <your-repo-url>
cd yidak
```

## 2) Install dependencies

Run in: `root` (`yidak/`).

```bash
pnpm install
```

## 3) Environment setup

This repo uses:

- `root/.env.local` for API + DB + shared runtime values.
- `apps/web/.env.local` for Next.js web runtime values.

### 3.1 Root env

Run in: `root` (`yidak/`).

```bash
cp .env.example .env.local
```

PowerShell equivalent (run in `root`):

```powershell
Copy-Item .env.example .env.local
```

Fill these values in `root/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL` (required for migrations)
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `API_URL`

### 3.2 Web env

Create/update `apps/web/.env.local` with at least:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

PowerShell quick-create example (run in `root`):

```powershell
New-Item -Path apps/web/.env.local -ItemType File -Force
```

## 4) Database commands (Drizzle)

Generate migrations.

Run in: `root` (`yidak/`).

```bash
pnpm --filter @yidak/db db:generate
```

Run migrations.

Run in: `root` (`yidak/`).

```bash
pnpm --filter @yidak/db db:migrate
```

If migration fails with `SUPABASE_DB_URL is required`, set `SUPABASE_DB_URL` in `root/.env.local`.

## 5) Start development

Run in: `root` (`yidak/`).

```bash
pnpm dev
```

Expected local services:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

If ports are busy, apps may pick random ports. Free ports `3000` and `3001` for stable local routing.

## 6) Quality checks

Run in: `root` (`yidak/`).

```bash
pnpm turbo run lint
pnpm turbo run typecheck
pnpm turbo run test
pnpm turbo run build
```

Run all key checks in one command.

Run in: `root` (`yidak/`).

```bash
pnpm turbo run lint typecheck test build
```

## Troubleshooting

### `Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`

Set these in `root/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### `SUPABASE_DB_URL is required for Drizzle config`

Set `SUPABASE_DB_URL` in `root/.env.local`.

### `GET /favicon.ico 404`

Restart the dev server.

Run in: `root` (`yidak/`).

```bash
pnpm dev
```

### Hydration mismatch warning

Usually caused by browser extensions mutating DOM. Test in an incognito window or disable extensions.

## Monorepo scripts

- `pnpm dev` (run in `root`) - run all apps in dev mode
- `pnpm build` (run in `root`) - build all packages/apps
- `pnpm lint` (run in `root`) - lint all packages/apps
- `pnpm typecheck` (run in `root`) - typecheck all packages/apps
- `pnpm test` (run in `root`) - run tests
- `pnpm test:e2e` (run in `root`) - run Playwright E2E tests
- `pnpm db:generate` (run in `root`) - run DB migration generation pipeline
- `pnpm db:migrate` (run in `root`) - run DB migration pipeline
