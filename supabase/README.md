# Supabase

| Object | Purpose |
| --- | --- |
| `families`, `family_members`, `children` | Family → parent → child. The child has a nickname only. |
| `snapshots`, `snapshot_heads` | Snapshot backup per child (to be replaced by live sync). |
| Row-level security | Clients can only read their own family's rows. |
| `public.upload_snapshot(...)` | The only client write path. Rejects unknown fields, free text and payloads over 1 MiB. |
| `private.provision_family(parent_user_id, nickname)` | Owner-only setup of the parent and child. |

`private.snapshot_schema()` must match `src/snapshot/schema.json` (a test checks this).

## Tests (local, synthetic)

```sh
python3 supabase/tests/test_database.py                                   # needs PostgreSQL 14+
node --experimental-strip-types --test supabase/tests/client/*.test.mjs
```

## Setup (owner)

These migrations implement the older snapshot backup, not live sync.

1. In the Supabase project: Authentication → turn off new sign-ups and anonymous sign-ins.
2. Run the SQL files in `supabase/migrations/` in order.
3. Check: `TA_SUPABASE_URL=… TA_SUPABASE_ANON_KEY=… node scripts/check-hosted-auth.mjs` must print `PASS` twice.
4. Create the parent user in the dashboard, then run `select private.provision_family('<user id>', '<nickname>');`.
5. Google sign-in is off. To turn it on, enable the Google provider, run `node --experimental-strip-types scripts/check-google-link.mjs --expect same` and `--expect refused`; if both pass, set `VITE_GOOGLE_LOGIN=on`.
