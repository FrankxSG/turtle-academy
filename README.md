# Turtle Academy

A primary-school learning PWA: daily practice in Chinese, Mathematics, English and Science, mistake-led review and a small adventure island.

**Current state:** the on-device learning engine, child and parent screens, offline saving, parent PIN, reviewed Chinese content and private mistake-pack import are built. Other subjects still use synthetic fixtures though their question pools exist. Sign-in and the older snapshot backup exist; live sync is not built.

## Run

Node 22 (see `.nvmrc`).

```sh
npm ci
npm run dev            # local app
npm run build          # public build
npm run build:private  # build with the private mistake pack enabled
npm run test:engine
npm run test:e2e       # browser tests; see src/ui/README.md
```

Sign-in needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Vercel settings are in `vercel.json`.

## Docs

- [AGENTS](AGENTS.md) — rules for Claude and ChatGPT
- [Pilot](docs/PILOT_FUNCTIONAL_DESIGN.md) — what the Pilot does
- [Technical decisions](docs/TECHNICAL_DESIGN_DECISIONS.md) — stack and privacy
- [Full scope](docs/FEATURE_SCOPE.md) — long-term ideas
- Content: [Chinese](docs/CHINESE_CONTENT_PREPARATION.md), [Mathematics](docs/MATHEMATICS_CONTENT_PREPARATION.md), [English](docs/ENGLISH_CONTENT_PREPARATION.md), [Science](docs/SCIENCE_CONTENT_PREPARATION.md)

This repo is public. Never commit real learner data or secrets.
