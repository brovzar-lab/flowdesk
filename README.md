# Lemaa App Development Platform

Monorepo for all Lemaa apps. We build apps like crazy and love making the world easier.

## Main page

![App main page](docs/main-page.png)

## Quick Start

```bash
npm install
npm run dev
```

## Structure

- `apps/` — Individual apps (each a standalone React+Vite+TypeScript project)
- `packages/shared/` — Shared utilities, types, and constants
- `.github/workflows/` — CI/CD (lint, typecheck, build, test on every PR)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **State**: React Query + Zustand
- **Testing**: Vitest + React Testing Library
- **Tooling**: Turborepo, ESLint, Prettier

## Adding a New App

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full conventions and the new-app scaffold guide.

## CI/CD

GitHub Actions runs on every push to `main`/`develop` and every PR:
1. Lint + Typecheck
2. Build
3. Test
