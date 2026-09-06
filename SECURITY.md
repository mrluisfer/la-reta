# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report them privately through GitHub's [**Report a vulnerability**](https://github.com/La-Reta/la-reta/security/advisories/new) flow (Security → Advisories), or by contacting the maintainer directly.

When reporting, please include:

- A description of the vulnerability and its impact.
- Steps to reproduce (a proof of concept if possible).
- Affected versions / routes.

We will acknowledge your report as soon as possible and keep you updated on the fix. Thank you for helping keep the project and its users safe.

## Scope

This policy covers the whole monorepo — the web app (`apps/la-reta-web`), the mobile app (`apps/la-reta-app`) and the shared packages.

This is a small, just-for-fun project. Sensitive surfaces worth noting:

- The admin area (`/admin`) and live scoreboard (`/live`) are gated by simple shared PINs (`ADMIN_PIN` / `LIVE_PIN`) — treat them as light gates, not strong authentication. The same PINs are exchanged for signed tokens by native clients through `/api/v1/auth/pin` (`PIN_TOKEN_SECRET`).
- `DATABASE_URL` and all secrets must stay in `apps/la-reta-web/.env.local` (or the hosting provider's environment) and never be committed. Anything shipped to the Expo app under `EXPO_PUBLIC_*` is public by definition — never put a secret there.
