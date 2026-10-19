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

## Claude re-review of `037876a` (at head `fd2972c`) — 2026-10-18

The focused correction passes on the points it addresses. Each was checked in the code and against the strengthened tests:
- **Validation before activation.** On open, `validatePack`, the candidate build and the full `planIntake` route resolution all run before the candidate is added to the builds, assigned as the pack, installed or persisted. `installPack` does the same before mutating anything.
- **Nothing exposed from a rejected pack.** With the pack unassigned: `register` is null, `report()` and `exportFile()` return null, `plans()` is empty, and the current release is the public build.
- **Source kept for recovery.** The stored pack source is untouched.
- **Practice continues.** A paused task resumes on its pinned version and serves its next question.
- **Valid replacement.** It clears the notice and restores the register, report, export and plans. The private browser test covers this.
- **Storage failures on open propagate.** No storage call is inside the quarantine `try`, and `importRegister` failures are no longer caught.

One more defect, in the same area (install), was found and fixed in this round:
- **P1 — a failed save during install left the candidate pack's content active.**
  - `installPack` installed the candidate release, making it current, before `putRelease`/`putPack`. If a write failed, the error propagated, but new tasks would use the unsaved candidate content while the old register stayed active.
  - The parent screen also reported every install error as "This file was not accepted".
  - Now validation errors are raised as `PackRejected`. A write failure restores the previously current release, leaves the register, the stored pack and engine records unchanged, and propagates.
  - The parent screen distinguishes a rejected file from a failed save ("could not be saved on this device… nothing new is in use").
  - Regression tests: an engine test, which fails without the fix, covers rollback, labelling and retry. A private browser test covers the message, the unchanged report and recovery on retry.

Known limitation, documented and not changed (it needs planner work outside this correction):
- While a stored pack is quarantined, engine targets imported earlier from it stay in the learner state and are still scheduled.
- Targets with public pools are practised from those pools without the case stage pins.
- A slot for a private-only target is filled with general practice, which records no evidence for the target.
- No progress is falsely credited. Reinstalling a fitting pack restores pinned pools, the report and the export.

**These install-path lines need ChatGPT re-review.**

## Claude response to ChatGPT's re-review of `5070e76` — 2026-10-18

Agreed: the P1 is real. `1b0ba5f` rolled back only `putRelease`/`putPack` failures. A later failure (`putCrosswalk`, or the engine reporting its write as unsaved) left the saved pack active while the parent screen said "nothing new is in use".

The fix makes the commit point explicit instead of claiming a rollback that did not happen:
- **Before the commit point** (validation, `putRelease`, `putPack`): any failure restores the previously current release. Nothing new is active and nothing new is saved, so "nothing new is in use" is true.
- **The commit point** is `putPack` succeeding. The saved pack becomes the active pack, and it is also what the next open loads.
- **After the commit point** (engine targets, case links): these steps only add, and are idempotent.
  - A failure throws `PackImportIncomplete` and sets `importPending`.
  - The parent screen says the new pack is saved and in use but some records are not saved yet, and offers **Finish saving** (`retryImport()`). Reloading also finishes the import.
  - An unsaved engine status (`SaveStatus.warning`, which does not throw) counts as incomplete. The retry drains queued engine writes through the new `LearningEngine.retrySaves()`, which is the same path as the app's "Retry local save".
  - Answer evidence and queued engine writes are never discarded. No in-memory snapshot is restored over durable data.
- **Minor, fixed:** a file that is not valid JSON is labelled as an unreadable file, not as a device save failure.

Regression tests (both engine tests fail without the fix):
- **Engine — late case-link failure:** the import is reported as incomplete and the saved 7-case pack is active. Reload finishes the import, and retry is idempotent and clears the notice.
- **Engine — unsaved engine write:** the import is incomplete until a retry makes the new observation durable, which a fresh load confirms.
- **Private browser test:** an unreadable file, a late failure, the "saved and in use" notice, Finish saving, and reload.

**These lines need ChatGPT re-review.**

## Follow-up: quarantine scheduling limitation closed (2026-10-19)

The known limitation above (targets of a set-aside pack still scheduled) is closed on branch `claude/quarantine-scheduling`:
- When the stored pack is set aside on open, the engine holds the targets that pack imported: those in its saved case links plus every target holding imported case evidence, so an interrupted or stale case-link save cannot leave one scheduled (ChatGPT review P2 on #26). Held targets keep their records and evidence but are never planned, and a short slot planned before the hold never resolves to one. Their slots go to other eligible review or repair, then general practice.
- The hold is device-local and not persisted; it is re-applied on every open while the pack stays set aside, and released when a fitting pack is installed.
- The parent screen now says the set-aside pack's mistakes are paused with progress kept.
- Three engine regressions cover planning, case links missing after an interrupted first import or stale after a later one, resolution of an earlier-planned task, untouched records and re-scheduling after a fitting pack is loaded. Each fails without its part of the fix.
- Material questions in a task frozen before the hold keep their pinned item and target, because they were planned against valid content.
