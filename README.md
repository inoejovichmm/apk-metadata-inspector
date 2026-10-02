# APK Metadata Inspector

A [Canopy](https://dashboard.thanarie.dev) project — Vite + React. After
`canopy deploy`, open the live app with `canopy open`.

- `npm install` — once, then:
- `canopy dev` — develop locally against the live platform (real data!)
- `canopy dev --local [--pull]` — offline sandbox with local data instead
- `canopy deploy` — build and publish `dist/`
- `AGENTS.md` — project guardrails and skill setup for coding agents

Push-to-main deploys are prepared in `.github/workflows/canopy-deploy.yml`
(needs a `CANOPY_DEPLOY_TOKEN` repo secret — see the workflow file).
