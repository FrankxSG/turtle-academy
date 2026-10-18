# PR25 review — 2026-10-18

Reviewed public head `c50d3515665230d3f9e1c60708b57f332148c3e2`, stacked on PR24 `7cdbd385f9bfe00661c2f1a2a16db95f465d2c12`.
Public main remains `f8516fdb3510b783b75e7efc0f60c9119636206f`.

## Corrections for independent re-review

- P1: normal startup opened the private database and bundled the pack programme and parent import/export panel. Public builds now compile that path out. Only `VITE_ENABLE_PRIVATE_PACK=true` together with explicit `--mode private` enables it; private output goes to `dist-private`. Inherited enablement in production mode fails. The bundle plugin checks module identities and the post-build check scans all emitted assets, including lazy chunks and service-worker files. Browser regression checks the unlocked public parent screen and absence of a private database; private synthetic browser coverage uses its own origin/build.
- P1: nested content/options/targets/plans could carry unvalidated metadata into persisted packs. Recursive structural privacy checks and nested allow-lists now validate those surfaces before intake, unknown routes are resolved before registry/storage mutation, and stored packs are revalidated on open. They reject identity-like key variants and email values; they cannot detect a personal name concealed in otherwise permitted learning text.
- P1: repair selection ignored case-pinned item versions and could use a different same-target pool. The catalogue now restricts imported targets to their explicit stage pins, and recomputes pending-content status on restart. An unavailable pinned version remains pending rather than falling back silently.
- P1: presentation text was keyed only by item ID. After an update, a paused task could display new options while its frozen catalogue graded the old key. Presentation lookup now includes the task's release version, including parent answer labels and material bodies. Missing historical text fails closed. Referenced private builds are retained for finished reports as well as paused tasks; public-only builds use a separate generic content cache with no private imports or records. Shared public cache pruning is deferred because another identity may reference an older build. Existing deleted historical builds cannot be reconstructed by this change.

## Evidence and limits

Local Node 24.19: type check, 83 engine tests, 3 UI integration tests, 48 Python content tests, catalogue validation, generated inventory and build-scanner regression pass. The public production build passes module/artifact exclusion; explicitly enabled production mode is rejected. Private build also compiles. No dependency/lockfile or backend changes.

Browser execution is blocked locally: Chromium is absent and the Playwright browser download returned invalid/truncated archives. No new screenshot or browser pass is claimed. CI must execute the public negative test, private synthetic flow and remaining suite on the resulting head; inspect synthetic screenshots before merge. Node 22 evidence must come from CI.

## Remaining gates

Request changes until the corrections receive independent re-review and CI/browser evidence is available. The review/repair-cap formula remains explicitly a proposal needing owner confirmation. Content/list/rights approval and the P1 source/layout audit remain PR24 gates. The existing data-protection, private coverage/proceed, authentication, backup and real-device gates remain; a private build flag does not authorize real-data deployment or resolve them.

No merge or deployment performed. Private case details, content and simulation logs are excluded from this public record.
