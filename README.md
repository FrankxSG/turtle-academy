# Turtle Academy

An original adventure-based learning PWA. The current development preview connects a small island hub, objective practice and local parent controls to the on-device learning engine. Chinese loads reviewed content; Science, Mathematics and English still use synthetic exercises. The private-pack build supports parent pack intake and progress export. These implementation facts do not establish subject-release or real-record readiness.

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

Before browser tests, run `npx playwright install chromium` and build with the public synthetic Auth configuration described in [the UI guide](src/ui/README.md). Tests mock Auth and contact no hosted service. Offline behavior is available in the production build, not the Vite development server.

The default public build excludes private-pack handling. `npm run build:private` enables that runtime for deliberate local pack loading; it does not bundle this project's private records or authorize deployment.

## Content preparation

Run `python3 scripts/content_review.py --check` for the public catalogue validators and Chinese inventory freshness check. Run it without `--check` to generate offline review pages at `reports/content/index.html`: all questions, whole materials, diagrams, blanks/pinyin, keys, hints, explanations, mappings and versioned source records. Generated pages are ignored by Git; edit the canonical JSON. These are author review aids, not app rendering or educational approval. [Content QA](docs/CONTENT_QA.md) and the existing authoring skills retain the human review requirements.

## Boundaries

- No runtime AI, analytics or external fonts. Password sign-in uses the existing Auth client; learning stays local.
- First-device setup requires online password sign-in for a pre-provisioned synthetic parent. There is no Pilot Guest or signup entry. Cached initialized practice remains available after token expiry, including offline.
- App updates require a deliberate click. IndexedDB is separate from the service-worker cache.
- Records can be lost if browser data is cleared or evicted. The older snapshot server contract exists, but the app has no cloud backup/upload/restore UI or live sync.
- The local PIN is a casual-access control, not encryption or server authorization. Hosted Auth configuration, Google linking and real-record readiness retain their separate verification gates.
- The legacy guest database is preserved separately and never assigned to a registered identity.
- Keep staging and production isolated. Never connect previews to real learner data.
- This repository is public since 2026-10-10. Never commit real learner data, account details or credentials.

Start with [AGENTS.md](AGENTS.md), then follow its task-specific references. [Full feature scope](docs/FEATURE_SCOPE.md) remains confirmed long-term scope.

## Vercel

The application build uses the Vite preset, root directory, `npm run build`, and `dist`. Sign-in needs public test Auth configuration; a build without it shows setup instructions and disables sign-in. Never use privileged keys or connect previews to real learner data. Review deployment controls and obtain approval before importing or deploying.
