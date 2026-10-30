# Supabase: identity, ownership and live sync

This folder holds the database migrations for the Pilot's server and their tests. Everything here is synthetic-only. Nothing in this folder creates a real record, a real account or a service key.

Live sync follows [Pilot Scope §3](../docs/PILOT_V0_1_SCOPE.md#3-identity-live-sync-and-backup-policy). The current build covers its first two increments: **one signed-in device** (changes are saved on the device, queued, uploaded, and recovered on a new or reset device) and **two-device offline reconciliation** (every answer kept once, one shared daily task, per-field settings by server-accepted stamp with history, add-only amendments, and one schedule per mistake on every device; tested against these functions in `supabase/tests/client/sync-live.test.ts`). Server snapshots, restore, pruning and deletion are later increments.

## What the migrations create

| Object | Purpose |
| --- | --- |
| `families`, `family_members`, `children` | Family → parent → child ownership. The child profile has a **nickname only**. |
| `sync_records` | The merged, server-authoritative value per child, kind and key. Deletions are kept as tombstones. Pack versions are immutable rows of kind `pack_version`. |
| `sync_receipts` | One row per applied upload operation: retry identity and the accepted stamp. |
| `sync_changes` | Add-only history of every record an operation touched. |
| `sync_field_history` | The value that lost a per-field stamp comparison (replaced, or arrived too late). |
| `sync_heads`, `sync_devices` | Per-child change counter and per-device ordering. |
| `public.sync_whoami()`, `public.sync_push(child, ops)`, `public.sync_pull(child, cursor, limit)` | The only client entry points. |
| `private.sync_schema()` | The closed `pilot-sync/1` allow-list: `src/sync/schema.json` merged with `src/sync/pack-schema.json` (parity-tested). |
| `snapshots`, `snapshot_heads`, `upload_snapshot` | The earlier one-device snapshot contract (Issue #16). **Retired:** no client role can call `upload_snapshot` any more. Its tables and recorded evidence stay. |
| `private.provision_family(parent_user_id, nickname)` | Owner-only setup of the one parent and child. |

Clients may only **read** their own family's rows (RLS). No client role (`anon`, `authenticated`, `service_role`) can insert, update or delete any table. Every table cascades from `children`.

## Sync rules (server side)

- **Upload** (`sync_push`): the caller must be a signed-in parent of the child (`42501` otherwise). Each operation is validated against the closed allow-list and applied in its own subtransaction, under a per-child lock, in device order; processing stops at the first refused operation. An identical retry returns the original result (`duplicate`, same stamp) without applying it again; an operation id reused with different content is refused (`operation_conflict`). References must resolve within the child (`invalid_reference`). Limits: 1.5 MiB per operation, 2 MiB and 50 operations per request. Results and errors carry codes only, never content.
- **Allow-list**: wrong forms (including the pack's `observed`), item/material `rationale` and `provenance`, the PIN or its hash, worksheets, school or teacher details, unknown fields and derived values (task aggregates, stages, due dates) are rejected. Practice text is bounded per field; the pack's `cause`, `correction_status` and `policy` are short single-line text.
- **Merge** (per kind; the descriptor names each kind's class): answer events, production events, completions, amendments and pack versions are add-only and never overwritten. A daily task keeps its first accepted frozen plan while progress only moves forward. Presentation status, checkpoint delivery, story state, exposure and calendar guards only move forward. Editable values (settings, X, rest days, suspensions, flag decisions, target mapping status, case links, the active pack) follow the server-accepted hybrid logical stamp; the server clamps a stamp more than five minutes in its future, once, and keeps the losing value in `sync_field_history`.
- **Download** (`sync_pull`): records changed after a server-issued cursor, in change order, at most 500 per page, bounded by the head read at the start of the call. Change numbers are assigned only while holding the child's lock, so a transaction that commits later always gets higher numbers: a cursor never skips it. Every upload re-issues the records it touched, so the uploading device re-reads the merged value.

## Running the tests (local, synthetic)

```sh
python3 supabase/tests/test_database.py      # Issue #16 snapshot contract (migrations before live sync)
python3 supabase/tests/test_sync.py          # live-sync contract, plus the client's own sync code against it
node --experimental-strip-types --test supabase/tests/client/*.test.mjs
```

Both Python suites need PostgreSQL 14+ server binaries, `psql` and Node 22. They start a throwaway local cluster, load `tests/harness/supabase_stub.sql` (Supabase's roles, `auth.uid()` and default privileges) and run as the client roles. `sync_server.py` puts a minimal stand-in for the Supabase Auth and RPC endpoints in front of that cluster; the browser tests (`tests/sync.spec.ts`) start it from `playwright.config.ts`. These harness files are for local tests only and are never applied to a hosted project.

## Owner steps (test project only, after review)

These are done by the owner. Never record project identifiers, URLs or keys in GitHub.

1. **Confirm the project.** Privately confirm that the project you are about to change is the Turtle Academy **test** project, not production and not another application's project.
2. **Auth settings** (Authentication → Sign In / Providers): turn **off** "Allow new users to sign up"; keep **Anonymous sign-ins** off; leave Google off.
3. **Apply the migrations** in `supabase/migrations/`, in filename order, once each, in the SQL editor or with the Supabase CLI. The live-sync migration (`20261023120000_live_sync.sql`) also retires `upload_snapshot`.
4. **Check the hosted Auth settings.**

   ```sh
   TA_SUPABASE_URL=… TA_SUPABASE_ANON_KEY=… node scripts/check-hosted-auth.mjs
   ```

   Both lines must say `PASS`. `INCONCLUSIVE` (exit 3) proves nothing: fix the cause and rerun. `FAIL` (exit 1) means an attempt was accepted.
5. **Synthetic parent only.** Create one synthetic test user in the dashboard, then run `select private.provision_family('<that user id>', 'Synthetic');`. Use a synthetic nickname until the data-protection gate is resolved. One parent has exactly one child in the Pilot; a second child makes sync stop with `multiple_child_profiles`.
6. **Google link test.** Unchanged from the Issue #16 contract: Google sign-in stays off unless `scripts/check-google-link.mjs` passes both `--expect same` and `--expect refused` against synthetic accounts, as described in [Pilot Scope §3](../docs/PILOT_V0_1_SCOPE.md#3-identity-live-sync-and-backup-policy).
7. **Point a test build at the project** with `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` only (never a service key), on the private test site.
8. Record in the PR **only** pass or fail for each step, with no identifiers.

## iPad checks (manual, synthetic records, test project only)

Use an iPad with Safari, the app added to the Home Screen, and the synthetic parent from step 5. Record each result as pass or fail in the PR; until then they are **unverified**.

1. Open the app from the Home Screen, sign in, set a PIN. Parent area → *Saving and sync* shows *Up to date*, *Changes waiting to upload: 0*.
2. Practise three Chinese questions. Within a few seconds, or after *Sync now*, the parent area shows *Up to date* and a new *Last successful sync* time.
3. Turn on Airplane Mode. Practise two questions and change Chinese X. The parent area shows *Offline*, a waiting count above 0 and the clearing-data warning.
4. Still offline, swipe the app away and reopen it. Practice resumes; the waiting count is unchanged.
5. Turn Airplane Mode off and bring the app to the foreground. It returns to *Up to date*, waiting 0, without any action.
6. Leave the app in the background for an hour or more (or past the session expiry) and reopen it while offline: practice works with no sign-in prompt. Back online, sync resumes on its own, or the parent area asks for sign-in and resumes after the same account signs in.
7. Remove the Home Screen app and its website data (Settings → Safari → Advanced → Website Data), reinstall, sign in and set a PIN. The parent area first shows *Restoring…*; then the hub offers *Resume Chinese* for an unfinished task, earlier answers appear in the practice summary, and (private build) the mistake pack and its case table are back without wrong forms.
8. Sign out from the parent area while a change is waiting, then sign in with a different synthetic parent: that parent's island opens empty, and nothing from the first parent appears on its server records.
