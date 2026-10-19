# Turtle Academy

An offline-capable learning app (PWA) for a Singapore primary pupil: daily practice in Chinese, Mathematics, English and Science, a mistake bank with spaced review, and a small adventure island.

## Run

Node 22 (see `.nvmrc`).

```sh
npm ci
npm run dev          # local app
npm run build        # production build
npm run test:engine  # engine tests
npm run test:e2e     # browser tests (first: npx playwright install chromium)
```

Deployed on Vercel with `vercel.json`. Sign-in needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Docs

- [Pilot functional design](docs/PILOT_FUNCTIONAL_DESIGN.md) — what the Pilot does
- [Technical design decisions](docs/TECHNICAL_DESIGN_DECISIONS.md) — stack and privacy rules
- [Full feature scope](docs/FEATURE_SCOPE.md) — long-term ideas
- Content: [Chinese](docs/CHINESE_CONTENT_PREPARATION.md), [Mathematics](docs/MATHEMATICS_CONTENT_PREPARATION.md), [English](docs/ENGLISH_CONTENT_PREPARATION.md), [Science](docs/SCIENCE_CONTENT_PREPARATION.md)

Never commit real learner data or secrets. This repository is public.
