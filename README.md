# yidak
# YIDAK (يدك) — CODEX PROMPT PLAYBOOK
## The Complete Production Build Sequence

---

## How to Use These Prompts

### Prerequisites
1. Create a GitHub repo named `yidak` (or your preferred name)
2. Open [codex.openai.com](https://codex.openai.com)
3. Connect your repo

### Execution Order

| # | Prompt | What It Builds | Estimated Time |
|---|--------|----------------|----------------|
| 0 | AGENTS.md | Coding standards file (send FIRST) | 2 min |
| 1 | Foundation | Monorepo, all configs, design tokens, shared packages | 15–20 min |
| 2 | Auth | Supabase Auth, OTP, role guards, animated onboarding | 10–15 min |
| 3 | tRPC API | All routers, procedures, middleware, client integration | 15–20 min |
| 4 | Job Posting | 5-step job creation, category grid, photo upload, maps | 15–20 min |
| 5 | Bidding Engine | Real-time bids, anti-sniping, optimistic UI, presence | 15–20 min |
| 6 | Chat | Real-time messaging, typing, read receipts, voice notes | 10–15 min |
| 7 | Payments | Tap Payments escrow, webhook handler, payment UI | 10–15 min |
| 8 | Reviews + Profiles | Star ratings, worker portfolios, tier system | 10–15 min |
| 9 | Arabic/RTL + i18n | Full RTL layout, 300+ translated keys, Hijri dates | 10–15 min |
| 10 | Notifications + Gamification | Push, in-app, badges, leaderboard, referrals | 10–15 min |
| 11 | Testing | Vitest, Playwright E2E, MSW mocks, CI pipeline | 15–20 min |
| 12 | Admin Dashboard | User mgmt, moderation, disputes, analytics | 10–15 min |
| 13 | Polish | Error boundaries, skeletons, PWA, SEO, accessibility | 10–15 min |

**Total: ~13 prompts, ~3–4 hours of Codex execution**

### Rules for Best Results

1. **Send Prompt 0 (AGENTS.md) first** — it controls code quality for everything after
2. **One prompt at a time** — wait for completion before sending the next
3. **Review generated code** between prompts — fix any issues before proceeding
4. **Run verification commands** after each prompt: `pnpm turbo run lint typecheck build`
5. **Commit after each prompt** — clean git history, easy rollback
6. **If Codex skips something** — send a follow-up: "You missed X from the previous prompt. Please create it now."

### Prompt Format Notes

Each prompt follows the structure that produces the best Codex output:
- **Goal**: What "done" means in one sentence
- **Context**: Framework versions, folder paths, existing patterns
- **Inputs**: Data shapes, Zod schemas, type definitions
- **Constraints**: Rules from AGENTS.md enforced per-prompt
- **Outputs**: Exact files to create with content specifications
- **Verification**: Build/test commands to run after

### File Listing

```
PROMPT-00-AGENTS-MD.md      → The AGENTS.md coding standards file
PROMPT-01-FOUNDATION.md     → Monorepo scaffold + design system
PROMPT-02-to-05.md          → Auth, tRPC API, Job Posting, Bidding
PROMPT-06-to-09.md          → Chat, Payments, Reviews, Arabic/RTL
PROMPT-10-to-13.md          → Notifications, Testing, Admin, Polish
```

---

## Architecture Summary

```
yidak/
├── AGENTS.md                    ← Codex reads this first (Prompt 0)
├── turbo.json                   ← Turborepo pipeline config
├── apps/
│   ├── web/                     ← Next.js 15 (customer + worker)
│   ├── api/                     ← Hono + tRPC (backend)
│   └── admin/                   ← Admin dashboard
├── packages/
│   ├── db/                      ← Drizzle ORM schemas + migrations
│   ├── types/                   ← Zod schemas + branded types
│   ├── ui/                      ← Shared components
│   ├── utils/                   ← Currency, date, geo helpers
│   ├── eslint-config/           ← Shared ESLint rules
│   └── typescript-config/       ← Shared tsconfigs
└── tooling/
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 + React 19 | App Router, Server Components, Turbopack |
| Styling | Tailwind v4 + shadcn/ui | Native RTL via logical properties |
| Animation | Framer Motion | Spring physics, layout animations |
| Backend | Hono on Bun | Ultra-fast, TypeScript-first |
| API | tRPC v11 | End-to-end type safety |
| Database | Supabase (PostgreSQL + PostGIS) | Auth, Realtime, Storage, RLS |
| ORM | Drizzle ORM | Type-safe SQL, fast migrations |
| Payments | Tap Payments | All 6 GCC countries, MADA, KNET |
| Real-time | Supabase Realtime | Broadcast, Presence, DB changes |
| State | Zustand + TanStack Query v5 | Minimal client state + server cache |
| i18n | next-intl | App Router native, ICU messages |
| Testing | Vitest + Playwright + MSW v2 | Unit, Component, E2E, API mocks |
| Monorepo | Turborepo + pnpm | Fast builds, dependency graph |

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | Deep Teal (oklch) | Buttons, links, active states |
| Secondary | Warm Gold (oklch) | Accents, premium badges |
| Success | Emerald Green | Completed, accepted, paid |
| Warning | Amber | Expiring soon, caution |
| Destructive | Rose Red | Errors, cancellations |
| Background | Warm White / Rich Dark | Light/dark mode |

Animations: Spring-based (never duration). Gentle (120/14), Snappy (300/30), Bouncy (200/10/0.8).
Typography: Inter Variable (Latin) + IBM Plex Arabic (Arabic). Arabic gets 1.05em multiplier.
RTL: ALL properties use logical (ps-/pe-/ms-/me-/start/end). NEVER left/right.
