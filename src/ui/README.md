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

## Behaviour notes

- Checkpoints are marked delivered and saved before they are shown (at most once across reload); a crash in between can skip that interaction rather than replay it.
- Four original story scenes share one sequence across subjects; later checkpoints give short companion interactions; the world stays after the story ends.
- Rest day opens exploration, keeps unfinished tasks and disables practice that day.
- UI/story language is independent of the academic content language. All assets and fonts are local; normal zoom stays enabled.
- PIN (`src/parent/device.ts`): WebCrypto PBKDF2-HMAC-SHA-256, 600,000 iterations, random 16-byte salt, 256-bit output, stored with failed-attempt state in a separate IndexedDB database. Back-off 1, 2, 4… seconds, capped at one hour; blocked attempts don't hash or reset the wait; storage errors fail closed. Exit, reload and backgrounding lock parent mode. Reset uses an ephemeral password sign-in for the same identity, online only. Not encryption and not server authorisation.
- The service worker precaches app files; a new version activates only on an explicit update click, disabled while an answer is saving or a storage error shows.
- Each signed-in identity gets its own working copy; a Web Lock stops two tabs writing at once.
