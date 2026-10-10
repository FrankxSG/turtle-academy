# Turtle Academy

An original adventure-based learning PWA. The current foundation preview contains one generic Science discovery, local guest persistence and an offline app shell. This is a technical validation, not the completed product or a confirmed MVP scope.

## Development

Use Node.js 22.21.1 (see `.nvmrc`).

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
npm run test:e2e
python3 scripts/privacy_guard.py
```

Before browser tests, run `npx playwright install chromium`. Offline behavior is available in the production build, not the Vite development server.

## Boundaries

- No runtime AI, analytics, external fonts or backend calls.
- Guest sample answers remain in this browser's IndexedDB; no account names or real learner fixtures are bundled.
- App updates require a deliberate click. IndexedDB is separate from the service-worker cache.
- Guest progress can be lost if browser data is cleared or evicted.
- Registered accounts, RLS, sync, curriculum packs, rewards, handwriting and parent controls remain unimplemented.
- Keep staging and production isolated. Never connect previews to real learner data.
- This repository is prepared for public publication. Never commit real learner data, account details or credentials.

Read `AGENTS.md`, `docs/TECHNICAL_DESIGN_DECISIONS.md`, `docs/FEATURE_SCOPE.md`, `docs/PILOT_V0_1_SCOPE.md` and `docs/FOUNDATION_SETUP.md` before implementation.

## Vercel

The proposed configuration uses the Vite preset, root directory, `npm run build`, and `dist`. No environment variables are required by this preview. Review deployment controls and obtain approval before importing or deploying.
