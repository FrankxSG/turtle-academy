# Technical design decisions

Confirmed architecture; code and recorded tests establish implementation. The [Pilot](PILOT_FUNCTIONAL_DESIGN.md) is the delivery subset; [full scope](FEATURE_SCOPE.md) preserves later capabilities.

| Area | Decision |
| --- | --- |
| App | React/Vite/TypeScript installable PWA; tablet, desktop and landscape phone |
| Offline | Dexie/IndexedDB local working copy; service worker caches generic app/content; cached practice survives expired sign-in |
| Backend | Supabase Auth/Postgres and private storage when needed; family/child ownership enforced server-side with RLS, not a PIN |
| Content | Original/rights-cleared, reviewed JSON; stable IDs/versions, keys, hints and explanations; active tasks pin their content |
| Learning | Deterministic objective checking; append-only answers; derived stages/dates/unlocks; story/completion kept separate |
| AI | No runtime AI/OCR/grading/voice processing; parent-initiated external preparation requires human verification |
| Sync | Owner-selected live sync, including the private pack; outcomes/recovery in Pilot §9; implementation pending |
| Cost | No additional paid infrastructure without approval; verify quotas before provisioning |

## Data and release

- Public Git/builds/previews contain generic code/content and synthetic fixtures only. Private-library extracts, learner records, images, worksheets, handwriting, school details and production exports never enter public artifacts or logs. Original personal files stay outside both repos.
- The private reference repo stays private, with no public submodule/CI/build access. Only the specifically approved anonymous mistake/authoring/report workflow belongs there; it is not general learner-file storage.
- Registered records belong to the authenticated family. Imports cannot assign ownership. Account switching never attaches guest/other-family records; later guest conversion needs explicit selective review. PIN/hash and observed wrong-form text remain device-only, including the pack's `observed` field.
- Before service writes, verify the dedicated project/environment from service metadata. Keep staging/production isolated, privileged keys server-side, public signup closed for Pilot, and synthetic negative ownership tests.
- Authorized synthetic development can proceed. Before real records, resolve private data locations, storage protection (provider encryption and any application-encryption need), provider/cross-border handling, necessary notices/consent, retention/deletion and unsynced-loss limits; record owner acceptance in the existing release record. No extra policy PR is required. Verify applicable privacy obligations before wider use.
- Pass synthetic isolation/sync/recovery and intended-device offline/update checks before real use. A local PIN is not encryption; browser storage can be evicted. No guarantee of mainland connectivity or indefinitely valid authentication.
- Publication, merge and deployment are distinct. Keep read-only, proportional CI and no production credentials for untrusted PRs. Preserve existing privacy protections when simplifying docs.

