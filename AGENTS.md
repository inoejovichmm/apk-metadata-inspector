# APK Metadata Inspector — a Canopy React SPA

A Vite + React single-page app on [Canopy](https://dashboard.thanarie.dev),
Monks' managed platform for internal projects. Everything is served behind
company login; there is no infrastructure to manage and none should be added.

## Canopy skill

The full SDK reference (auth, db, blob, ai) and platform guardrails ship as an
agent skill, kept out of this scaffold so it stays current. Install it before
building features:

```
npx skills add mediamonks/canopy
```

If that fails the skill isn't published yet — the SDK surface is documented on
the [Canopy dashboard](https://dashboard.thanarie.dev).

## Working on this project

- A standard Vite + React + TypeScript app; `npm install` once, then develop
  with `canopy dev` (it runs Vite with this project's `vite.config.ts` and
  proxies `/_api` to the platform).
- The SDK comes from npm (`@mediamonks/canopy`) — the shared instance lives in
  `src/canopy.ts`.
- `canopy dev` uses LIVE project data: read freely, but take a
  `canopy db snapshot` before risky data changes.
- `canopy dev --local [--pull]` — offline sandbox with local data instead;
  writes never reach the platform. Prefer it for destructive experiments.
- `canopy deploy` — builds (`npm run build`) and publishes `dist/`; use
  `canopy open` to visit the live app.
- Risky change (schema migration, backend rework)? `canopy deploy --staging`
  first — a private copy with its own database cloned from live — verify, then
  `canopy promote` ships the exact tested version. Never promote with failing
  checks.

## Boundaries

- Do not add auth — the platform authenticates every request before it
  reaches this app.
- Do not store secrets anywhere in this project, and never call external APIs
  that need them from the browser — all backend needs go through the Canopy
  SDK (`canopy.auth`, `canopy.db`, `canopy.blob`, `canopy.ai`).
- Frontend only: no SSR, no custom servers, no databases outside `canopy.db`.
  (Need backend code? Recreate on the `worker` template, or ask the Canopy
  team.)
