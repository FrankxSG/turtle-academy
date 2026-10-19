# UI

- `App.tsx` entry and navigation; `runtime.ts` opens the engine, store and a single-tab lock.
- `Practice.tsx` shows tasks and withholds feedback until a passage's first answers are in; `Answer.tsx` renders choice, word bank, ordering and matching.
- `development.ts` holds synthetic fixtures for subjects without wired content.
- Parent PIN: `src/parent/device.ts`.

Browser tests use a synthetic build:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:4173 VITE_SUPABASE_ANON_KEY=synthetic-test-only npm run build
npm run test:e2e
```
