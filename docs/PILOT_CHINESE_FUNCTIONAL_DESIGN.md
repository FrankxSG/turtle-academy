# Pilot v0.1 — Chinese Functional Design

**Status:** Draft specifications for Claude review; documentation only.
**Baseline:** `main` at `1c24e5b44d62746e2fb776d71215b1f3d779a45a`, 2026-10-12.
**Tracking:** Issue #6; preceding decisions in Issue #3 and merged PR #5.
**Authorization:** Prepare specifications and a Draft PR. Implementation, service changes, merge, deployment, real-record import and spending are not authorized.

## 1. Authority and design status

Read [technical decisions](TECHNICAL_DESIGN_DECISIONS.md), [full scope](FEATURE_SCOPE.md), [Pilot scope](PILOT_V0_1_SCOPE.md), [content QA](CONTENT_QA.md) and [collaboration protocol](AI_COLLABORATION.md). These documents control confirmed requirements. This document makes those requirements concrete; all new operational details below are **proposals for review**, unless explicitly marked owner-confirmed. A merged design document alone must not be interpreted as permission to implement.

**New owner-confirmed design choice, 2026-10-12:** three different questions correct consecutively clear a practice step. The selected option was presented as first-attempt correctness without answer-revealing hints. Detailed independence, reset and reopening semantics are proposed in the [engine specification](PILOT_LEARNING_ENGINE_SPEC.md). Clearing a step is not provisional mastery.

The supplied older planning snapshots were consulted, but the newer merged Pilot decisions govern: Registered-only, Chinese first, private bank and parent-reviewed paste-in, bounded playable hub, ephemeral tracing and authenticated snapshot backup. Four subjects remain the Pilot completion requirement.

## 2. Learning purpose and boundaries

The Chinese unit teaches recognition, meaning, character distinctions, word use and sentence context through reviewed repair activities. A private verified target selects generic exercises at runtime. The app revisits the recorded error type without diagnosing its cause or copying the source worksheet.

The first internal release includes the small movable 2D hub, one companion, location-triggered Chinese quests, learning loop, private bank, reviewed paste-in, offline working copy and safe backup. This is not a standalone flashcard release. Actual catalogue authorship, target coverage and full app/backend implementation are outside this design task.

No runtime AI/OCR, machine handwriting assessment, learner-specific public exercises, public registration, Guest, rich economy, full portfolio, original worksheet upload or automatic multi-device merge. The approximately 10–15 targets in the Pilot scope are a planning estimate, not a content cap or a list to invent here. Do not assert MOE/year alignment until verified against an authoritative source in the content QA batch.

## 3. Actors and parent boundary

| Actor | Permitted flow | Boundary |
| --- | --- | --- |
| Provisioned parent | Login, review/import candidates, correct classifications, inspect summary and backup state | Private Family → Child ownership; parent-only route is not sufficient server authorization |
| Child using provisioned profile | Explore, learn, pause/resume, request guidance, practise voluntarily | No intake approval, restore or destructive operation; open work remains ungraded |
| Content editor | Author complete generic curriculum groups and reviewed variants | Public-safe curriculum content; cannot inspect production mistake records |
| Authorized backend owner | Govern retention and requested deletion | Separate owner-only operations; not added by this design PR |

Pilot parent-login and sensitive-operation rules remain in Pilot scope. Parent intake uses an explicit parent gate in the UI; its strength and session lifetime must be settled in the authentication design. Do not represent a UI gate as proof that the person operating the device is an adult. Restore/logout/deletion require the already confirmed reauthentication policy.

## 4. Parent intake: screen and transaction contract

| Screen | Required behavior | Failure/exit behavior |
| --- | --- | --- |
| Preparation notice | Explain that extraction occurs privately outside the app; every candidate needs parent review | No image picker, OCR button or AI request |
| Paste structured candidates | Accept only a bounded versioned structure; show validation before persistence | Reject unknown fields, malformed entries and oversized payloads without logging values |
| Source occasion | Choose fixed-list source type, date only, and new worksheet or same prior worksheet | Generate opaque source-instance reference for new; select existing reference for same; no title/source-description field |
| Review candidates | Show target, recorded error type, verification and catalogue availability separately | Require accept/uncertain/reject for every candidate; no bulk automatic verification |
| Preview import | Separate new targets, repeated independent observations, duplicates, uncertain and pending-content entries | Counts only; no claim that target coverage or copyright permission is automatic |
| Commit | Transactionally save decisions, targets, observations and one logical import receipt | No partial import; repeated confirmation/retry returns existing receipt |
| Summary | State what can receive practice and what awaits review/content; show local-save and backup status separately | Backup failure does not roll back a successful local import |

Proposed input fields: `schemaVersion`, candidate rows of `targetKind`, `targetText`, `errorType`, optional `confusionText`. Input has no copied question, answer prose, image, name, school or free-text source field. `confusionText` is narrowly bounded character/word contrast, not a worksheet sentence. Human extraction confidence is not accepted as parent verification. Parent decisions are recorded by the app, not trusted from pasted flags.

Proposed limits for review: 100 candidates per import, 64 KiB encoded input, 12 Unicode code points per target/contrast. These are engineering bounds, not confirmed curriculum restrictions. Reject unsupported lengths visibly; never truncate a target and silently import a different one. The input adapter must provide a documented template and readable errors, and reject pasted instructions/HTML as data. Render values as text only; clear temporary paste/review memory on exit.

Source dates describe an observation occasion, not an exam date or school. Selecting the same source-instance and target creates no new occurrence. New batches alone do not add recurrence. If the parent cannot establish a separate occasion, retain uncertainty rather than manufacture independent evidence. Runtime mistakes use a session occasion under the same independent-observation rule.

Import is built only after the private group-coverage comparison, rough aggregate and explicit owner proceed decision in Issue #3. This design does not perform that comparison or authorize its completion.

## 5. Bank lifecycle and parent correction

| Verification | Catalogue mapping | Prescribed ladder |
| --- | --- | --- |
| Uncertain | Any | None; voluntary generic lesson still available |
| Rejected | Any | None; retain bounded review provenance under future retention policy |
| Verified knowledge error | Complete reviewed coverage | Exact → similar → generic |
| Verified target | Unmatched/incomplete | `pending_content`; no fabricated substitute |
| Verified possible slip/unclear | Any | None until parent reclassifies |
| Handwriting presentation only | Any | Optional ungraded tracing; no knowledge/mastery deduction |

Editing a classification appends a parent-review event and reruns derivation. It does not rewrite the original observation. Removing a target from practice is distinct from deleting its private records; deletion/retention is governed by the unresolved data-protection policy. No approval event can mint objective correctness or clear a ladder step.

Matching uses normalized target identity and recorded error type against approved mappings. Do not fuzzy-match unsupported words or infer a cause. A mapping can support one target/type but lack its exact contrast; treat that ladder as incomplete, not covered. Later reviewed catalogue versions may activate previously pending entries with a parent-visible change notice.

## 6. Child journey: playable hub to learning

1. After first online login and cache preparation, enter the bounded hub. Avatar can move by tap; the companion offers short repeatable instructions. Chinese quest location opens a mission card. No lesson is forced by a timer.
2. Mission card explains one learning focus with a short goal, resume state and an exit. A due target is chosen privately by the engine. Child copy need not disclose worksheet provenance or label the child careless.
3. Teach the relevant distinction with an original reviewed example. Teaching material is separate from evidence questions. Child may replay instructions and choose accessible controls.
4. Run the current ladder step. Each answer receives curated objective feedback or an explicit ungraded reference/self-review flow. No advancement based solely on tracing, self-check or completion.
5. At the attempt boundary, commit the event before showing saved progress. Offer a break, return to hub or another bounded activity. Resume uses the same item presentation and assistance state, not a fresh first attempt.
6. When three eligible different questions are correct consecutively, present “这一关练习完成” and move to the next ladder step. After generic clears, show “之后再来试一试” rather than permanent mastery.
7. Quest completion adds a small visible world change, such as a restored generic sign or lit path. Completion and world state are separate from knowledge evidence. A child can finish a guided story visit even if a practice step needs another day; no punitive lost decoration.

Proposed mission size: one active target per mission, up to six objective question presentations before offering a stopping point; maximum twelve prescribed presentations per visit. Teaching/tracing and instruction replay do not count as failed answers. These are reviewable bounds; the app offers voluntary generic learning without bypassing personalised ladder gates. Exhausted reviewed items produce “more reviewed practice needed” rather than repeated items masquerading as new evidence.

## 7. Interaction and feedback contracts

| Activity | Check | Assistance and evidence |
| --- | --- | --- |
| Recognition/meaning choice | Reviewed option ID | First attempt eligible; random option order is not a new question |
| Word/context selection | Enumerated answer IDs and reviewed variants | Sentence reading support is allowed only when it does not reveal the tested language distinction |
| Matching/order | Exact reviewed mapping/order; explicit accepted variants | Tap-to-place alternative; event describes the whole submitted response |
| Structured word response | Reviewed normalized variants only | No fuzzy grading; unsupported input remains a visible mismatch for parent review |
| Tracing | No correctness check | Finger/stylus, no stroke-order inference; discard strokes on exit/background interruption; never backup |
| Optional explanation/writing | Ungraded | Initial response, curated model, optional self-/parent review; never contributes an automatic mastery success |

Feedback explains the distinction without assigning a personal cause. After an error: “看看这两个字有什么不同，再试一试。” On an ungraded activity: “和例子比一比。” Never show a tracing score, a self-review as correct, or a completed quest as mastered.

Instruction replay and motor/accessibility help are not necessarily teaching hints. Every asset declares whether it reveals the tested answer. Pinyin/audio that resolves a tested pronunciation or recognition item counts as answer-revealing help; ordinary instruction replay does not. Where uncertain, conservatively mark the attempt assisted. No audio recording or AI voice service; use bundled reviewed assets if audio is authored, otherwise clear text instructions.

## 8. Parent summary

Show verification/content availability, next practice step, why a target is prioritized in plain language, step evidence and delayed-review status. Use “需要更多独立练习记录” where evidence is insufficient. Do not invent percentages of attention, knowledge diagnosis, or efficacy.

Show local save, pending backup, last successful backup and “backup paused — action needed” separately. Parent review must not change the child's objective outcome. UI routes must never expose another family after account switch. Genuine private values are absent from logs, telemetry, error reports and public screenshots.

## 9. Offline, privacy and release dependencies

Cached reviewed lessons and local practice continue after network/auth expiry; cloud work waits for valid authentication. No network request is required to select or evaluate cached tasks. Snapshot backup is the confirmed linear-head model, not sync. This document introduces no RPC, database table or provider change.

The approved snapshot allowlist contains minimal structured targets/status, provenance, dated attempts/reviews and structured progress. Free-text drafts, copied questions, tracing, worksheet images and local safety copies remain excluded. Actual error targets require plaintext-storage reevaluation under TDD §9. Local drafts and safety copies still require privately agreed retention/access/deletion policy; this PR does not settle it.

An app/cache update must retain local events and reject incompatible content without silently resetting evidence. Unavailable/corrupt storage stops record writes and shows recovery information without overwriting unfamiliar records. See [engine contract](PILOT_LEARNING_ENGINE_SPEC.md) and [acceptance cases](PILOT_CHINESE_ACCEPTANCE.md).

## 10. Claude review requested

Review the current PR head for consistency with main, practical first-release scope, valid independence semantics, ambiguity in recurrence/import, conservative mastery claims, content exhaustion, browser resilience and privacy leaks. Challenge the proposed limits/thresholds; do not assume they are owner-confirmed. Record findings and reviewed SHA on the PR. No implementation, merge, deployment or service changes are requested.
