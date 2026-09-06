<div align="center">

# ⚽ Reta Fútbol

**A FIFA-style manager for organizing pickup football ("la reta").**

Players as FIFA-style cards, attribute ratings, professional-looking profiles, a live scoreboard, and a balanced-team generator — on the web and on your phone.

[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)](https://turborepo.dev) [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org) [![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)](https://neon.tech) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

> This is a **just-for-fun** project. No profit motive, nothing but good vibes and a well-organized kickabout. Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 📦 What's in this monorepo

| Workspace | What it is | Docs |
| --- | --- | --- |
| `apps/la-reta-web` | The Next.js 16 web app — dashboard, admin, database, `/api/v1` | [README](./apps/la-reta-web/README.md) |
| `apps/la-reta-app` | The Expo / React Native mobile client | [README](./apps/la-reta-app/README.md) |
| `packages/ui` | Shared React components | — |
| `packages/typescript-config` | Shared `tsconfig` bases | — |

The web app owns the database and is the source of truth; the mobile app talks to it through `apps/la-reta-web/app/api/v1`.

## ✨ Features

- **FIFA-style player cards** with position-weighted overall and card tiers (bronze / silver / gold / special).
- **Player profiles** — attributes, radar chart, stat history, goal history, and open reviews with star ratings and emoji reactions.
- **Balanced team generator** — splits selected players into even sides, spreads positions sensibly (it's 7-a-side, so exact spots stay loose), and shuffles for variety between generations. Add last-minute **guests** on the fly.
- **Live scoreboard** (`/live`) — track goals in real time and save the match.
- **"Casacas" wheel** (`/casacas`) — a spin-the-wheel that randomly picks who washes the bibs each reta, never repeating the last two.
- **Photos** — upload a match photo (poster-style header) and player pictures, stored on Vercel Blob.
- **Community touches** — a rotating "La Reta ____" banner, ideas board, reports/help inbox, and player sign-up requests.
- **Accounts** — sign in with [Clerk](https://clerk.com); comments and some actions require a session.
- **Admin area** (`/admin`) — PIN-gated management of players, matches, ideas, reports, sign-ups, and moderation (archive comments without deleting them).

## 🧱 Stack

- **[Turborepo](https://turborepo.dev)** + npm workspaces (single lockfile at the root)
- **Web:** [Next.js 16](https://nextjs.org) (App Router, Server Components & Server Actions) · [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) · [Tailwind CSS v4](https://tailwindcss.com)
- **Mobile:** [Expo SDK 57](https://expo.dev) · [Expo Router](https://docs.expo.dev/router/introduction/) · [NativeWind v5](https://www.nativewind.dev)
- **Data:** [Drizzle ORM](https://orm.drizzle.team) + [Neon](https://neon.tech) (serverless Postgres)
- **Auth:** [Clerk](https://clerk.com) on both clients
- **Media:** [Vercel Blob](https://vercel.com/docs/vercel-blob) for image uploads (public store)
- **Quality:** [Ultracite](https://www.ultracite.ai) (ESLint + Prettier + Stylelint) with Husky + lint-staged

## 🚀 Getting started

### Prerequisites

- **Node.js 24+** and **npm 12+**
- A free **[Neon](https://neon.tech)** Postgres database
- _Optional:_ a **[Clerk](https://clerk.com)** app (accounts/sign-in) and a **public [Vercel Blob](https://vercel.com/docs/vercel-blob)** store (image uploads) — the app runs without them, those features just stay off.
- _For mobile:_ the [Expo Go](https://expo.dev/go) app, or an iOS Simulator / Android emulator.

### Setup

```bash
# 1. Clone and install (one install for every workspace)
git clone https://github.com/La-Reta/la-reta.git
cd la-reta
npm install

# 2. Configure the web environment
cp apps/la-reta-web/.env.example apps/la-reta-web/.env.local
#    then paste your Neon connection string

# 3. Create the schema and seed sample data
npm run db:push -w la-reta-web    # sync the Drizzle schema to Neon
npm run db:seed -w la-reta-web    # insert the sample roster (⚠️ see below)

# 4. Run it
npm run dev                       # every app, through Turborepo
npm run dev:web                   # just the web app  → http://localhost:3000
npm run dev:app                   # just the Expo app → press i / a / w
```

Environment variables are documented in the [web app README](./apps/la-reta-web/README.md#environment-variables).

## 📜 Root scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run every workspace's dev task (Turborepo) |
| `npm run dev:web` | Only the Next.js app |
| `npm run dev:app` | Only the Expo app |
| `npm run build` | Build every workspace |
| `npm run check` | Ultracite: lint + format + styles (the pre-commit gate) |
| `npm run fix` | Ultracite autofix |
| `npm run lint` | Per-workspace linters (`expo lint` for the mobile app) |
| `npm run check-types` | TypeScript across the monorepo |

Workspace-specific scripts (`db:push`, `db:seed`, `ios`, `android`, …) live in each app and run with `-w <workspace>`, e.g. `npm run db:studio -w la-reta-web`.

> ⚠️ **Data safety:** `db:seed` **deletes** the `players` table (cascading to `match_goals`). Never run it — or any destructive DML — against real data. Schema changes must be **additive**.

## 🗂️ Repo layout

```bash
apps/
  la-reta-web/        Next.js 16 app — app/, components/, lib/, drizzle/
  la-reta-app/        Expo app — src/app (routes), src/components, src/hooks
packages/
  ui/                 Shared React components
  typescript-config/  Shared tsconfig bases
docs/
  agents/             Conventions for AI agents (issues, triage, domain docs)
.github/              Issue templates & pull request template
```

## 🤝 Contributing

Contributions of all sizes are welcome! Please read **[CONTRIBUTING.md](./CONTRIBUTING.md)** and our **[Code of Conduct](./CODE_OF_CONDUCT.md)** first. Good first steps:

- Open an [issue](https://github.com/La-Reta/la-reta/issues) for a bug or idea.
- Pick something small and send a focused pull request.

Security reports go through [SECURITY.md](./SECURITY.md), not public issues.

> ⚠️ **Heads-up for contributors:** the web app is Next.js **16** and the mobile app is Expo **SDK 57** — several APIs differ from older versions. Read [`AGENTS.md`](./AGENTS.md) and the per-app `AGENTS.md` before writing framework code.

## 📄 License

[MIT](./LICENSE) © Luis Alvarez
