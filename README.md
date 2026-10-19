# Turtle Academy

A primary-school learning PWA: daily practice, mistake-led review and a small adventure island. Chinese releases first, then Science, Mathematics and English.

## Current state

Main contains the local learning engine, child/parent screens, offline persistence, PIN controls, reviewed Chinese integration and private-pack intake/export. Other subjects still use synthetic UI fixtures although authored pools exist. Auth and the earlier snapshot server contract exist; live learning-record sync, snapshot restore UI, hosted readiness and real-device release acceptance are not established by this documentation change.

Current implementation evidence belongs on the relevant merged PR/CI run, not a second status log.

## Run and check

Node 22 (see `.nvmrc`), then `npm ci` and `npm run dev`. Sign-in needs public test `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; no privileged key.

`npm run typecheck`, `npm run test:engine`, `npm run test:ui`, `npm run build`, `python3 scripts/privacy_guard.py`. Browser tests: build using the [synthetic configuration](src/ui/README.md), install Chromium with `npx playwright install chromium`, then `npm run test:e2e`.

Existing pack-enabled builds use `npm run build:private`; default public builds exclude that runtime. These are current packaging facts, not a decision to change the build architecture. Deployment uses `vercel.json` and requires owner authorization.

## Read only what you need

- [AGENTS](AGENTS.md): shared collaboration rules; Claude imports the same file.
- [Pilot](docs/PILOT_FUNCTIONAL_DESIGN.md): behavior and release checks.
- [Technical decisions](docs/TECHNICAL_DESIGN_DECISIONS.md): architecture and data boundaries.
- [Full scope](docs/FEATURE_SCOPE.md): confirmed long-term capabilities, not a release checklist.
- Content: [Chinese](docs/CHINESE_CONTENT_PREPARATION.md), [Mathematics](docs/MATHEMATICS_CONTENT_PREPARATION.md), [English](docs/ENGLISH_CONTENT_PREPARATION.md), [Science](docs/SCIENCE_CONTENT_PREPARATION.md).

This repo is public. Keep real learner data and secrets out of Git, previews, fixtures and logs.

