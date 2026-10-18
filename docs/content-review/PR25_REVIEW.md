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

## Claude re-review of `52062ef` — 2026-10-18

Agreed, kept as committed:
- Private-pack code and storage are compiled out of the public build. Only an explicit `--mode private` with `VITE_ENABLE_PRIVATE_PACK=true` enables them, and the bundle scan backs this up.
- Recursive pack validation and route resolution happen before any mutation.
- Case-pinned stage pools apply. A missing pinned version stays pending.
- Presentation text is keyed by the task's release version.

Local checks: 84 engine tests, 3 UI tests, the build-scanner test, 48 Python content tests, catalogue and inventory checks, the privacy guard, and a type check with stubbed libraries all pass.

Corrected in this round:
- **P1: an unusable stored pack stopped the app opening.**
  - Since `52062ef`, opening the app re-validates and re-imports the stored pack. If a later app version's stricter checks, or a content change, no longer accept it, `MistakeProgram.open` threw, so the runtime failed and the child could not practise any subject.
  - The stored pack is now set aside instead. Its reason shows in the parent area (`openError`), engine records stay untouched, and practice continues. Loading a fitting pack clears the message.
  - A regression test covers both causes and fails without the fix.
- **P3: one missing text broke the parent area.** Parent practice history shows a dash for a question whose text is no longer on the device, instead of failing the whole parent area. Practice itself still fails closed.

Noted, not changed: `Mistakes.tsx` returns before its hooks when the build flag is off. That is safe because the flag is a build-time constant and the component is never rendered in that build.

## Owner decision — 2026-10-18

The review/repair cap `max(X − material questions, ceil(X/2))` is confirmed by the owner. It is no longer a proposal; the decision is recorded in `src/engine/policy.ts` and `docs/PILOT_FUNCTIONAL_DESIGN.md`.


## ChatGPT re-review of `eac4fcb` — 2026-10-18

The owner-confirmed repair cap and the P1 source-audit follow-up are accepted as recorded decisions/evidence, not outstanding proposals. The audit script verifies pinned checksums and all recorded P1 fields against the extracted columns; the supplied PDFs are not present in this checkout, so this re-review does not claim a second extraction or visual spot-check. Claude's missing-history-text fallback is accepted; practice remains strict about pinned wording.

One P1 remains in the new stored-pack recovery implementation: a structurally valid pack with an unknown route is installed and assigned to `p.pack` before the import fails. Catching that failure leaves its register, reports, production plans and export active even while the parent is told it was set aside. The earlier regression only checked that a task could be created.

Correction: resolve the complete intake before activating or persisting a stored candidate. A rejected candidate retains its original stored file for recovery and reports a parent notice, while report/export/production plans are unavailable and new tasks use the public catalogue. Pinned historical builds remain available. Do not catch persistence failures as if they were harmless validation failures: a failed write can occur after engine records change and must propagate.

Regression evidence: the strengthened existing test fails on the reviewed head at `register === null`; it now checks report/export/plans, the current release, preserved source and unchanged engine targets for both rejection causes. A second test covers write-failure propagation. A private synthetic browser test checks the parent notice, hidden report/export/plans and recovery by installing a valid file, and captures `private-pack-recovery.png`.

No content, policy, dependency, backend, merge or deployment changes. These correction lines require Claude re-review. Current-head test/CI and screenshot results are recorded in the PR review comment.
