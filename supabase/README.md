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
| `private.snapshot_schema()` | The closed snapshot allow-list. It is identical to `src/snapshot/schema.json`, and a test enforces that. |

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
node --experimental-strip-types --test supabase/tests/client/client.test.mjs     # Node 22, no dependencies
```

`test_database.py` starts a throwaway local cluster and loads `tests/harness/supabase_stub.sql`, which reproduces Supabase's roles, `auth.uid()` and broad default privileges. It then applies every migration and runs the tests **as the client roles** (`SET ROLE` + `request.jwt.claims`), never as the table owner.
- Each call is a separate connection, so the race tests use genuinely separate transactions. They also check that the second writer really waited on the first.
- The harness file is for local tests only and is never applied to a hosted project.

Both test suites share `tests/fixtures/`: one populated synthetic snapshot, and the list of changes that must be rejected (wrong forms, PIN or hash, worksheet text or images, copied questions, free-text source descriptions, school or teacher details, safety copies, unknown keys, out-of-range values). The server and the client must agree on every case.

## Owner steps (test project only, after review)

These are done by the owner. Never record project identifiers, URLs or keys in GitHub.

1. **Confirm the project.** Privately confirm that the project you are about to change is the Turtle Academy **test** project, not production and not another application's project.
2. **Auth settings** (Authentication → Sign In / Providers):
   - turn **off** "Allow new users to sign up"
   - keep **Anonymous sign-ins** off
   - leave Google off unless the separate staging link test passes (Pilot Scope §3)
3. **Apply the migration.** Run the SQL file in `supabase/migrations/` once, in the SQL editor or with the Supabase CLI.
4. **Check the hosted Auth settings.**

   ```sh
   TA_SUPABASE_URL=… TA_SUPABASE_ANON_KEY=… node scripts/check-hosted-auth.mjs
   ```

   Both lines must say `PASS`. The script prints only the HTTP status codes.
5. **Synthetic parent only.** Create one synthetic test user in the dashboard, then run `select private.provision_family('<that user id>', 'Synthetic');` in the SQL editor. Do not use a real child's nickname until the data-protection gate is resolved.
6. Record in the PR **only** pass or fail for steps 2–5, with no identifiers.

The hosted checks stay **pending** until the owner records them. The local SQL tests cannot verify hosted Auth configuration.
