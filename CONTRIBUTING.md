# Contributing to Reta Fútbol

Thanks for your interest in contributing! This is a small, just-for-fun project, so contributions of any size are welcome — bug fixes, features, docs, or ideas.

By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting set up

1. **Fork** the repo and clone your fork.
2. Install dependencies from the **repo root**: `npm install` (Node.js **24+**, npm **12+**). One install covers every workspace — don't install inside `apps/*`.
3. Copy `apps/la-reta-web/.env.example` to `apps/la-reta-web/.env.local` and add your [Neon](https://neon.tech) `DATABASE_URL`.
4. Create the schema and sample data:

   ```bash
   npm run db:push -w la-reta-web
   npm run db:seed -w la-reta-web
   ```

5. Start what you're working on:

   ```bash
   npm run dev:web   # Next.js app  → http://localhost:3000
   npm run dev:app   # Expo app     → press i / a / w
   npm run dev       # everything, through Turborepo
   ```

See the [README](./README.md) for more setup detail, and each app's README for workspace specifics.

## Repo layout

| Workspace          | What it is                                       |
| ------------------ | ------------------------------------------------ |
| `apps/la-reta-web` | Next.js 16 app — owns the database and `/api/v1` |
| `apps/la-reta-app` | Expo / React Native mobile client                |
| `packages/*`       | Shared UI and TypeScript config                  |

Keep changes inside the workspace they belong to. Shared code goes in `packages/*`, not copied between apps.

## Ground rules

### ⚠️ Data safety (hard rule)

- `db:seed` **deletes** the `players` table (cascading to `match_goals`). **Never** run it — or any destructive DML — against real/production data.
- All schema changes must be **additive** (new columns/tables + `db:push`). Never rewrite or drop existing user data.

### Framework versions matter

The web app is **Next.js 16** and the mobile app is **Expo SDK 57**. Several APIs differ from older versions and from what you may expect.

- Web: read the relevant guide in `node_modules/next/dist/docs/` before writing framework code (see [`apps/la-reta-web/AGENTS.md`](./apps/la-reta-web/AGENTS.md)). Prefer Server Components and Server Actions; TanStack Query is used only in the players gallery.
- Mobile: read the versioned docs at <https://docs.expo.dev/versions/v57.0.0/> (see [`apps/la-reta-app/AGENTS.md`](./apps/la-reta-app/AGENTS.md)).

## Workflow

1. Create a branch from `main`:

   ```bash
   git checkout -b feat/short-description   # or fix/, docs/, chore/
   ```

2. Make focused changes — keep pull requests small and single-purpose.
3. Before you push, make sure the project is clean:

   ```bash
   npm run check         # Ultracite: ESLint + Prettier + Stylelint
   npm run check-types   # TypeScript across the monorepo
   npm run build         # must compile (source of truth for CSS)
   ```

   `npm run fix` autofixes most of what `check` reports. A Husky pre-commit hook runs the same gate over staged files.

   > There is no test runner configured. Verify your change by exercising the affected flow in the running app.

4. Push and open a pull request against `main`:

   ```bash
   gh pr create --fill
   ```

   `--fill` uses your commit as the PR title and body, so a good commit message is the whole PR. Without it you get the template to fill in by hand — say what changed, how you verified it, and add a before/after for anything visual.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add emoji reactions to player comments
fix: survive Neon cold starts in the db retry loop
docs: rewrite the README in English
chore: bump dependencies
```

Common types: `feat`, `fix`, `docs`, `refactor`, `chore`, `style`, `perf`.

## Code style

- **TypeScript** everywhere; match the style of the surrounding code.
- Linting and formatting are **Ultracite** (ESLint + Prettier + Stylelint), configured at the repo root. Run `npm run fix` before committing — it settles almost every style nit.
- `apps/la-reta-app` is deliberately **outside** Ultracite's ESLint: React Native is linted by `expo lint` from that workspace, and only formatted at the root.
- **Web:** Tailwind CSS v4 (`prettier-plugin-tailwindcss` orders classes). Components live under `components/ui`, `components/app`, `components/features/<domain>`, and `components/shared`. Server Actions live in `app/actions/*.ts`, one file per domain.
- **Mobile:** NativeWind v5 (`className` on React Native components), routes under `src/app` via Expo Router.

## Reporting bugs & requesting features

Use the [issue templates](https://github.com/La-Reta/la-reta/issues/new/choose). For security issues, please read [SECURITY.md](./SECURITY.md) instead of opening a public issue.

Happy hacking, and enjoy the reta! ⚽
