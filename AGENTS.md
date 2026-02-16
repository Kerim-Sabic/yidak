# Yidak (يدك) — Codex Agent Instructions

## Project Overview
Yidak ("Your Hand" in Arabic) is a Shariah-compliant reverse-auction handyman marketplace targeting all 6 GCC countries (UAE, KSA, Qatar, Bahrain, Kuwait, Oman). Customers post jobs with a budget; workers competitively bid DOWN. The lowest qualified bid wins.

## Tech Stack (STRICT — do not deviate)
- **Runtime**: Node.js 22+ with pnpm 9+
- **Frontend**: Next.js 15 App Router (React 19, Turbopack)
- **Backend API**: Hono on Bun (in apps/api)
- **Database**: Supabase (PostgreSQL 16 + PostGIS + pgvector)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **API Layer**: tRPC v11 with Zod validation
- **Auth**: Supabase Auth with @supabase/ssr
- **Real-time**: Supabase Realtime (postgres_changes + Broadcast + Presence)
- **Payments**: Stripe (Payment Intents API, Connect for marketplace payouts, Elements for UI)
- **Styling**: Tailwind CSS v4 + shadcn/ui + Framer Motion (Motion)
- **State**: Zustand + TanStack Query v5
- **i18n**: next-intl with [locale] route segment
- **Testing**: Vitest + Playwright + MSW v2
- **Monorepo**: Turborepo with pnpm workspaces
- **Linting**: ESLint flat config + Prettier
- **Package manager**: pnpm ONLY (never npm or yarn)

## Monorepo Structure
```
yidak/
├── AGENTS.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── apps/
│   ├── web/                    # Next.js 15 (customer + worker PWA)
│   │   ├── AGENTS.md           # Web-specific instructions
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── (auth)/
│   │   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   │   ├── signup/page.tsx
│   │   │   │   │   │   └── verify/page.tsx
│   │   │   │   │   ├── (customer)/
│   │   │   │   │   │   ├── layout.tsx
│   │   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   │   ├── jobs/
│   │   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │   │       ├── @bids/page.tsx
│   │   │   │   │   │   │       ├── @bids/loading.tsx
│   │   │   │   │   │   │       └── @chat/page.tsx
│   │   │   │   │   │   └── payments/page.tsx
│   │   │   │   │   ├── (worker)/
│   │   │   │   │   │   ├── layout.tsx
│   │   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   │   ├── jobs/page.tsx
│   │   │   │   │   │   ├── earnings/page.tsx
│   │   │   │   │   │   └── profile/page.tsx
│   │   │   │   │   └── (admin)/
│   │   │   │   │       ├── layout.tsx
│   │   │   │   │       └── dashboard/page.tsx
│   │   │   │   └── api/
│   │   │   │       ├── trpc/[trpc]/route.ts
│   │   │   │       └── webhooks/
│   │   │   │           └── stripe/route.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/          # shadcn/ui components (generated)
│   │   │   │   ├── primitives/  # app-specific wrappers
│   │   │   │   ├── blocks/      # composed feature blocks
│   │   │   │   └── layouts/     # layout components
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   ├── server.ts
│   │   │   │   │   └── middleware.ts
│   │   │   │   ├── trpc/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   ├── server.ts
│   │   │   │   │   └── provider.tsx
│   │   │   │   └── utils.ts
│   │   │   ├── hooks/
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   └── messages/
│   │       ├── en.json
│   │       └── ar.json
│   ├── api/                     # Hono API server
│   │   ├── AGENTS.md
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── trpc/
│   │   │   │   ├── router.ts
│   │   │   │   ├── context.ts
│   │   │   │   ├── middleware.ts
│   │   │   │   └── routers/
│   │   │   │       ├── job.ts
│   │   │   │       ├── bid.ts
│   │   │   │       ├── user.ts
│   │   │   │       ├── payment.ts
│   │   │   │       ├── chat.ts
│   │   │   │       ├── review.ts
│   │   │   │       └── notification.ts
│   │   │   ├── services/
│   │   │   ├── webhooks/
│   │   │   └── lib/
│   │   └── package.json
│   └── admin/                   # Next.js admin dashboard (Phase 2)
├── packages/
│   ├── db/                      # Drizzle schema + migrations
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── index.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── jobs.ts
│   │   │   │   ├── bids.ts
│   │   │   │   ├── payments.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── reviews.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── enums.ts
│   │   │   ├── relations.ts
│   │   │   ├── client.ts
│   │   │   └── migrate.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   ├── types/                   # Shared Zod schemas + branded types
│   │   ├── src/
│   │   │   ├── ids.ts           # Branded ID types
│   │   │   ├── job.ts
│   │   │   ├── bid.ts
│   │   │   ├── user.ts
│   │   │   ├── payment.ts
│   │   │   ├── chat.ts
│   │   │   ├── review.ts
│   │   │   ├── errors.ts        # Custom error types
│   │   │   └── index.ts
│   │   └── package.json
│   ├── ui/                      # Shared UI components
│   │   └── package.json
│   ├── utils/                   # Shared utilities
│   │   ├── src/
│   │   │   ├── currency.ts      # GCC currency formatting
│   │   │   ├── date.ts          # Hijri calendar, prayer times
│   │   │   ├── geo.ts           # PostGIS helpers
│   │   │   └── result.ts        # neverthrow re-exports
│   │   └── package.json
│   ├── eslint-config/
│   └── typescript-config/
└── tooling/
    └── scripts/
```

## Build & Test Commands
- `pnpm install` — install all dependencies
- `pnpm turbo run build` — build all packages and apps
- `pnpm turbo run lint` — lint everything
- `pnpm turbo run typecheck` — run tsc --noEmit on all packages
- `pnpm turbo run test` — run Vitest on all packages
- `pnpm turbo run test:e2e` — run Playwright E2E tests
- `pnpm db:generate` — generate Drizzle migrations
- `pnpm db:migrate` — run migrations
- `pnpm dev` — start all apps in dev mode

Run `pnpm turbo run lint typecheck test` before committing.

## TypeScript Standards (STRICT — violations are bugs)
- `strict: true` in all tsconfig.json — never disable
- NEVER use `any` — use `unknown` and narrow with type guards
- NEVER use type assertions (`as`) — use `satisfies` or type guards
- NEVER use `// @ts-ignore` or `// @ts-expect-error`
- ALL exported functions MUST have explicit return types
- ALL function parameters MUST be typed (no implicit `any`)
- Use `readonly` arrays and objects wherever mutation isn't needed
- Use branded types for ALL entity IDs (UserId, JobId, BidId, etc.)
- Use discriminated unions for ALL state machines (job status, bid status, payment status)
- Use Zod schemas as single source of truth — infer TypeScript types from Zod
- Use neverthrow `Result<T, E>` for all service-layer functions that can fail
- Use `satisfies` operator for type checking without widening
- Use `const` assertions for literal types
- Maximum function length: 30 lines. Extract helpers aggressively.
- Maximum file length: 200 lines. Split into focused modules.

## React / Next.js Conventions
- Server Components by DEFAULT. Only add 'use client' when the component needs:
  - Event handlers (onClick, onChange, onSubmit)
  - React hooks (useState, useEffect, useRef)
  - Browser APIs (window, document, navigator)
  - Third-party client libraries (Framer Motion, Zustand)
- Server Actions for ALL mutations — validate input with Zod server-side
- Use `useActionState` (React 19) for form state management
- Use `useFormStatus` inside <form> for loading states on submit buttons
- Use Suspense boundaries with streaming for async data
- Each page.tsx should be a Server Component that fetches data and passes to Client Components
- Custom hooks: prefix with `use`, one responsibility per hook, typed return
- Component props: always use interface (not type) for component props
- No prop drilling deeper than 2 levels — use context or Zustand
- Every page MUST have: loading.tsx (skeleton), error.tsx (error boundary), not-found.tsx where applicable

## Styling & UI Rules
- Tailwind CSS v4 with LOGICAL PROPERTIES ONLY for RTL support:
  - `ps-*` not `pl-*` (padding-inline-start)
  - `pe-*` not `pr-*` (padding-inline-end)
  - `ms-*` not `ml-*` (margin-inline-start)
  - `me-*` not `mr-*` (margin-inline-end)
  - `text-start` not `text-left`
  - `text-end` not `text-right`
  - `float-start` not `float-left`
  - `rounded-s-*` not `rounded-l-*`
  - `border-s-*` not `border-l-*`
  - `start-*` not `left-*` (positioning)
  - `end-*` not `right-*` (positioning)
- NEVER use `pl-`, `pr-`, `ml-`, `mr-`, `text-left`, `text-right`, `left-`, `right-`, `rounded-l-`, `rounded-r-`, `border-l-`, `border-r-` in className
- shadcn/ui components live in src/components/ui/ — never modify directly
- Custom wrappers go in src/components/primitives/
- Composed feature blocks go in src/components/blocks/
- Framer Motion: use spring animations (stiffness/damping), NEVER duration-based
- Animation presets:
  - Gentle: { type: "spring", stiffness: 120, damping: 14 }
  - Snappy: { type: "spring", stiffness: 300, damping: 30 }
  - Bouncy: { type: "spring", stiffness: 200, damping: 10, mass: 0.8 }
- Always wrap animations with `useReducedMotion()` check
- Color tokens defined in CSS variables (oklch color space)
- Dark mode via `class` strategy with next-themes

## Database Rules (Drizzle ORM)
- Schema defined in packages/db/src/schema/
- Every table MUST have: id (uuid, primaryKey, defaultRandom), created_at (timestamp with timezone, defaultNow), updated_at (timestamp with timezone, defaultNow with trigger)
- Use PostgreSQL enums for fixed sets (job_status, bid_status, user_role, payment_status)
- Use PostGIS geography(Point, 4326) for location columns
- ALWAYS create indexes on: foreign keys, columns used in WHERE clauses, columns used in ORDER BY
- Composite indexes for common query patterns (e.g., bids: [job_id, amount])
- Enable RLS on EVERY table — no exceptions
- Soft deletes: use `deleted_at` timestamp, filter in queries
- Audit columns: `created_by`, `updated_by` where applicable

## API Layer Rules (tRPC v11)
- Routers organized by domain: job, bid, user, payment, chat, review, notification
- Input validation: always use Zod schemas from @yidak/types
- Output validation: define explicit output schemas
- Error handling: use TRPCError with proper codes (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR)
- Auth middleware: `protectedProcedure` requires valid session
- Role middleware: `customerProcedure`, `workerProcedure`, `adminProcedure`
- Rate limiting middleware on write operations
- NEVER return sensitive data (passwords, tokens, internal IDs) in responses

## Testing Rules
- Unit tests (Vitest): test business logic, Zod schemas, utility functions
- Component tests: React Testing Library with user-event
- E2E tests (Playwright): critical user flows (signup, post job, place bid, pay)
- Every tRPC procedure MUST have at least 2 tests (success + error case)
- MSW v2 for mocking Supabase and Stripe APIs in tests
- Test file naming: `*.test.ts` co-located with source
- Playwright tests in apps/web/e2e/

## i18n Rules (next-intl)
- Default locale: en
- Supported locales: en, ar
- All user-facing strings MUST use `useTranslations()` hook or `getTranslations()` server function
- NEVER hardcode user-facing strings in components
- Message keys: dot-notation namespaced (e.g., "jobs.create.title", "bids.place.button")
- Arabic messages must be professionally translated (not Google Translate)
- Numbers: use `useFormatter()` for locale-aware formatting
- Currencies: always format with Intl.NumberFormat using proper currency code (AED, SAR, KWD, BHD, QAR, OMR)
- BHD, KWD, OMR use 3 decimal places; AED, SAR, QAR use 2
- Dates: support both Gregorian and Hijri calendars

## Security Rules
- ALWAYS use `supabase.auth.getUser()` server-side — NEVER trust `getSession()`
- Validate ALL user input with Zod (frontend AND backend)
- Sanitize user-generated HTML with DOMPurify before rendering
- CSP headers configured in next.config.ts
- Rate limit all API endpoints
- Never log sensitive data (tokens, passwords, payment info)
- Stripe webhooks: verify signature using stripe.webhooks.constructEvent()
- File uploads: validate MIME type, max size 10MB, scan for malware

## Git Conventions
- Commits: conventional commits (feat:, fix:, chore:, docs:, refactor:, test:)
- Branch naming: feature/YIDAK-{number}-description, fix/YIDAK-{number}-description
- PR description: what changed, why, screenshots if UI
```
