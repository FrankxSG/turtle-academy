# Supabase: Pilot identity, ownership and snapshot contract

Issue #16. This folder holds the database migration for the Pilot's **server foundation** and its tests. Everything here is synthetic-only. Nothing in this folder creates a real record, a real account or a service key.

## What the migration creates

| Object | Purpose |
| --- | --- |
| `families`, `family_members`, `children` | Family → parent → child ownership. The child profile has a **nickname only**: no real name, birth date or school column exists. |
| `snapshots`, `snapshot_heads` | Linear backup history per child, with one server-authoritative committed head. |
| RLS + grants | Clients may only **read** their own family's rows. No client role (`anon`, `authenticated`, `service_role`) can insert, update or delete any table. |
| `public.upload_snapshot(child, operation_id, base, payload)` | The **only** client write path (see below). |
| `private.provision_family(parent_user_id, nickname)` | Owner-only setup of the one parent and child. Not callable by any client role. |
| Google sign-in | Built in `src/auth/client.ts` (OAuth with PKCE) but **off** unless `VITE_GOOGLE_LOGIN=on`, which is set only after step 6 below passes. Email/password always remains. |
| `private.snapshot_schema()` | The closed snapshot allow-list. It is identical to `src/snapshot/schema.json`, and a test enforces that. |

### What a snapshot holds (`pilot-snapshot/1`)

The snapshot carries the **recoverable source state** the learning engine needs (Learning Engine §2 and §6). Stages, due dates and unlocks are not stored; the engine derives them from this state.

| Section | Holds |
| --- | --- |
| `targets` | Target identity (kind, knowledge point, bounded correct value, assessed skill, error type or `unknown`, mapping and verification status, supersession) and its **observation history**: source type, observed and recorded dates, opaque source and batch references, and first / independent recurrence / duplicate |
| `presentations` | Each presented question: task, position, item and version, **role**, material, target and stage, format class (high- or low-option), first-response eligibility, prior exposures, novel context, status |
| `events` | Attempts in local order: phase (first, retry, correction), assistance and a **structured response** (single choice, ordered options, matching pairs or word-bank selection) |
| `tasks` | Frozen X, `policy_version`, content version, created and finalised times, the **frozen plan** (materials and slots, with short slots that pick their question when presented), active-time state changes and per-target aggregates (route, starting stage, related presentations, high- and low-option successes, any first wrong, clearances, outcome, final-stage not-before date) |
| `eligibility` | Not-before dates by reason (next day after import, cooldown, final-stage gate and so on) |
| `amendments` | Parent amendment lineage: what was amended or invalidated, its replacement and a controlled reason |
| `story` | Checkpoints with story sequence and **pending or delivered** state, chapter, world flags |
| also | Settings and timezone history, completions, rest days, flags, suspensions, exposure, calendar guards and safe pending-upload metadata |

Excluded and unrepresentable: the observed wrong form, the parent PIN or its hash, worksheet images or text, copied questions, free-text descriptions, school or teacher details and local safety copies. Taxonomy fields (`assessed_skill`, `error_type`, material `family`, world flags) are lowercase tokens of at most 48 characters, so sentences cannot be stored. P3 Mathematics is not an accepted course in the Pilot.

### Upload rules (`upload_snapshot`)

- The caller must be a signed-in parent of that child; anyone else gets `42501`.
- All uploads for one child are serialised on that child's head row.
- **Retry identity** is child + operation id + identical request (base + payload). An identical retry returns the original result (`replayed = true`) and never creates a row or rewinds the head, even after later uploads. Reusing an operation id with a different request is rejected with `PT409 operation_conflict`.
- **Minimisation is enforced here**, at the server write boundary. Every object is closed (unknown keys are rejected, nested ones included). Strings are only enums, opaque IDs, dates or bounded target values, so free text cannot be stored. The payload must name this child. The size limit is 1 MiB. Failures give `PT422 invalid_snapshot` or `PT413 snapshot_too_large`, and the error never echoes the payload.
- **Linear head:** the base must equal the current head. Otherwise the upload fails with `PT409 stale_base` and nothing is overwritten. A base-less first snapshot is accepted only when the server, holding the head-row lock, sees no committed head.

Out of scope here, and waiting on separate gates (Pilot Scope §3, Technical Decisions §9):
- the backup upload and restore UI and the background uploader
- the safety copy
- owner pruning and deletion operations
- any real child record

## Running the tests (local, synthetic)

```sh
python3 supabase/tests/test_database.py                                          # needs PostgreSQL 14+ server binaries and psql
node --experimental-strip-types --test supabase/tests/client/*.test.mjs          # Node 22, no dependencies
```

`test_database.py` starts a throwaway local cluster and loads `tests/harness/supabase_stub.sql`, which reproduces Supabase's roles, `auth.uid()` and broad default privileges. It then applies every migration and runs the tests **as the client roles** (`SET ROLE` + `request.jwt.claims`), never as the table owner.
- Each call is a separate connection, so the race tests use genuinely separate transactions. They also check that the second writer really waited on the first.
- The harness file is for local tests only and is never applied to a hosted project.

Both test suites share `tests/fixtures/`: one fully populated synthetic snapshot (a test checks that it fills every declared field and every array, and the database test round-trips it unchanged), and the list of changes that must be rejected (wrong forms, PIN or hash, worksheet text or images, copied questions, free-text source descriptions, school or teacher details, safety copies, unknown keys, out-of-range values). The server and the client must agree on every case.

## Owner steps (test project only, after review)

These are done by the owner. Never record project identifiers, URLs or keys in GitHub.

1. **Confirm the project.** Privately confirm that the project you are about to change is the Turtle Academy **test** project, not production and not another application's project.
2. **Auth settings** (Authentication → Sign In / Providers):
   - turn **off** "Allow new users to sign up"
   - keep **Anonymous sign-ins** off
   - leave Google off for now (step 6 tests it)
3. **Apply the migration.** Run the SQL file in `supabase/migrations/` once, in the SQL editor or with the Supabase CLI.
4. **Check the hosted Auth settings.**

   ```sh
   TA_SUPABASE_URL=… TA_SUPABASE_ANON_KEY=… node scripts/check-hosted-auth.mjs
   ```

   Both lines must say `PASS`. A probe passes **only** on the documented refusal code (`signup_disabled`; for the anonymous probe also `anonymous_provider_disabled`). Any other answer, such as an invalid key, an address or CAPTCHA error, rate limiting or a network failure, prints `INCONCLUSIVE` and exits with code 3: it proves nothing, so fix the cause and rerun. `FAIL` (exit 1) means an attempt was accepted. The script prints only status codes and error codes.
5. **Synthetic parent only.** Create one synthetic test user in the dashboard, then run `select private.provision_family('<that user id>', 'Synthetic');` in the SQL editor. Do not use a real child's nickname until the data-protection gate is resolved.
6. **Google link test (Pilot Scope §3).** Google sign-in is built but switched off. It may be switched on only if this test passes.
   - Create the synthetic parent in step 5 with the email of a **synthetic Google test account**, marked confirmed.
   - Turn on the Google provider in the test project, and add `http://127.0.0.1:54329/callback` to the redirect allow-list. Keep sign-ups off.
   - Run with that same Google account; it must print `PASS … SAME pre-provisioned parent`:
     ```sh
     TA_SUPABASE_URL=… TA_SUPABASE_ANON_KEY=… TA_PARENT_EMAIL=… TA_PARENT_PASSWORD=… \
       node --experimental-strip-types scripts/check-google-link.mjs --expect same
     ```
   - Run again with `--expect refused`, signing in with a **different** Google account. It must print `PASS … the server refused to create an account (signup_disabled)`, and the Users list must show no new user. Cancelling the Google consent screen, a network or token-exchange failure, or any other error prints `INCONCLUSIVE` (exit 3) and does not count: rerun it.
   - Rerun the password sign-in to confirm email/password still works.
   - If any run fails, Google stays off for the Pilot and returns with the invitation flow (Pilot Scope §3).
   - Only if all pass: set `VITE_GOOGLE_LOGIN=on` in the app's environment, and add the app's real callback page to the redirect allow-list.
7. Record in the PR **only** pass or fail for steps 2–6, with no identifiers.

The hosted checks stay **pending** until the owner records them. The local SQL tests cannot verify hosted Auth configuration.
