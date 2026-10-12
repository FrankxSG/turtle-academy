# Pilot Chinese — Acceptance and Review Matrix

**Status:** Proposed future acceptance tests, not executed implementation tests.
**Date/base:** 2026-10-12, `1c24e5b44d62746e2fb776d71215b1f3d779a45a`; Issue #6.
**Contracts:** [functional design](PILOT_CHINESE_FUNCTIONAL_DESIGN.md), [engine specification](PILOT_LEARNING_ENGINE_SPEC.md), [Pilot scope](PILOT_V0_1_SCOPE.md).

Use synthetic targets, original generic items, synthetic families and injectable clocks. No real worksheets, private errors, handwriting, progress or production credentials in tests/screenshots/CI. This document neither adds tests to the application nor authorizes implementation.

## 1. Requirements traceability

| Confirmed requirement | Specification | Acceptance IDs |
| --- | --- | --- |
| Chinese first plus bounded hub (P0-01/10) | Functional §§2,6 | F01–F03 |
| Private verified/uncertain/unmatched bank (P0-08/16) | Functional §§4–5; Engine §3 | I01–I09 |
| Owner rule: three different successes per step | Engine §§4–5 | E01–E08 |
| Event-derived step/schedule/mastery (P0-07/18) | Engine §§5–7 | E09–E15 |
| Reviewed versioned deterministic content (P0-03/04/12) | Engine §§2,4 | C01–C05 |
| Offline saves/resume (P0-05/06/11) | Functional §9; Engine §8 | R01–R07 |
| Auth/RLS and snapshot backup (P0-13/14/15) | Existing Pilot register; Engine §8 | B01–B09 |
| Ungraded ephemeral tracing and device acceptance (P0-17/19) | Functional §7 | D01–D05 |

## 2. Functional and intake cases

| ID | Given/action | Required outcome |
| --- | --- | --- |
| F01 | Move avatar to Chinese quest location | Opens meaningful reviewed learning mission; companion available; movement alone is not evidence |
| F02 | Complete a guided quest while a practice step remains uncleared | World change can persist; no mastery label/forced endless loop |
| F03 | Pause and return to hub/reopen mission | Same saved question/help state resumes; no new first attempt |
| I01 | Parent reviews mixed accepted/uncertain/rejected candidates | Verification and coverage shown separately; no automatic bulk verification |
| I02 | Verified synthetic target lacks complete group coverage | Stored privately as pending content; no fabricated ladder |
| I03 | Reimport same target/type/source-instance in a new batch | No added independent observation; idempotent retry has one receipt |
| I04 | Same target on independently established new worksheet | One new observation; same-day worksheet still cannot count as a different mastery day |
| I05 | Several wrong appearances in one worksheet/session | Attempt details may remain; recurrence counts one occasion |
| I06 | Unknown fields/copied source text/oversized/malformed input | Reject before commit; no private values in errors/logs; prior bank untouched |
| I07 | Parent reclassifies slip/unclear to knowledge error | Provenance retained; eligible only when verified and fully covered |
| I08 | Parent rejects/retracts earlier verification | Prescription suspends; derived state updates; historical observation not rewritten |
| I09 | Interrupted import transaction and repeated confirm | All-or-nothing save; one logical import; backup error does not erase local success |

## 3. Evidence and planner cases

| ID | Synthetic sequence | Required outcome |
| --- | --- | --- |
| E01 | Two eligible different correct answers at Exact | Exact remains uncleared |
| E02 | Three eligible different consecutive correct answers | Exact clears; Similar unlocked; Generic locked |
| E03 | Correct, correct, wrong, correct, correct | Streak is two; no clearance; a further eligible distinct correct clears |
| E04 | Three cosmetic variants sharing equivalence set | At most one success; item IDs/option randomization do not create independence |
| E05 | Answer-revealing help then correct; wrong then corrected | Practice feedback saved; no first-attempt success; proposed reset rule applies |
| E06 | Neutral instruction replay/motor accessibility help | Does not itself invalidate otherwise eligible answer |
| E07 | Tracing/self-check/open response/parent approval | No objective success, no step advancement; labelled ungraded/reviewed accurately |
| E08 | Exit/reload after error or help | Cannot turn retry into first attempt; persisted assistance survives |
| E09 | Clear Exact only or all three steps in one day | Step/ladder progress only; provisional mastery still false |
| E10 | Meets proposed varied different-day delayed conditions | Provisional label can derive only with underlying compatible evidence; expose policy version |
| E11 | Restored snapshot omits success events but includes stale cached flags | Rebuild status without unsupported mastery/step clearance |
| E12 | New verified independent error after provisional state | Reopens proposed repair epoch/priority; world decorations and historical evidence remain |
| E13 | Miss days 1/3/7 and return later | One milestone visit credit per day; no fake completed reviews or missed-day penalty |
| E14 | Several equally due targets/one recurrent target | Deterministic recurrence priority, stable tie-break and round-robin caps; no monopolized visit |
| E15 | Clock reversal/timezone change or exhausted fresh item pool | No fabricated delayed/novel evidence; show insufficient evidence; allow stopping/generic lesson |

E03/E05/E10/E12–E15 validate proposed policy semantics only if those details are approved. They are not evidence that numerical thresholds are educationally validated.

## 4. Content and persistence cases

| ID | Condition | Required outcome |
| --- | --- | --- |
| C01 | Duplicate IDs/missing key/explanation/mapping/QA status | Validator rejects affected catalogue release |
| C02 | Group has fewer than three distinct evidence questions in a stage | Mapping not ladder-ready; no repeated-item substitution |
| C03 | Objective response with reviewed accepted variant | Deterministic match; free prose never fuzzy-scored |
| C04 | Content answer/construct changes | Explicit compatibility decision; affected evidence invalidated, history preserved |
| C05 | Public batch publication | Complete original/licensed curriculum group; no private target-driven per-item explanation or genuine source reproduction |
| R01 | Cached app offline with expired Auth | Lessons/evaluation/import/local save work; cloud waits; no remote asset dependency |
| R02 | Attempt commit fails/quota exhausted | Unsaved response visible, no advancement, no silent database reset |
| R03 | App killed after transaction/before feedback | Committed attempt resumes once; no doubled event or lost mistake |
| R04 | Duplicate save request/multiple tabs | Idempotent event, transactional sequence; stale state cannot bypass first-attempt rules |
| R05 | Service-worker update with unfinished presentation | Saved boundary and compatible content; draft/help state retained |
| R06 | Unknown/corrupt local schema | Fail safely and preserve unfamiliar data; no auto-overwrite |
| R07 | Storage eviction | Explain lost local data and available authenticated recovery honestly; no promise of indefinite storage |

## 5. Security and backup dependency cases

These remain required from Pilot §7.3; detailed implementation belongs to the separately authorized backup/Auth work. Synthetic real-device UI tests alone cannot establish backend authorization.

| ID | Condition | Required outcome |
| --- | --- | --- |
| B01 | Anonymous, other-family or spoofed-child access | Server/RLS deny read/write; UI hiding is not the check |
| B02 | First snapshot/duplicate/interrupted retry | One committed linear head; persisted pending metadata; lost response after commit is safe |
| B03 | Competing stale-base upload | Reject; stop uploads; retain local work; show paused state |
| B04 | Restore cancellation/schema error/safety-copy failure | Preserve active copy and pending records; remain paused |
| B05 | Successful current-head restore then new work | Event-derived statuses rebuild; next upload uses restored base; no conflicting replay |
| B06 | More than ten snapshots/pruning concurrent with upload | Newest ten recoverable snapshots/head retained; next upload valid; ordinary client cannot prune |
| B07 | Owner-mediated all-snapshot deletion and restart | Other child unaffected; pause uploads; no silent recreation; explicit reauthenticated server-checked new-history flow |
| B08 | Snapshot serialization/local safety copy | Approved structured allowlist only; no strokes, drafts, worksheets, copied questions or safety copies in cloud payload |
| B09 | Account switch/logout/reauthentication failure | No cross-family cache exposure or unauthorized sensitive action; privately agreed retention policy tested |

Real-record handling remains blocked by TDD §9, actual-target plaintext reevaluation, safety-copy design, independently verified environments and all applicable synthetic security gates. Listing these cases is not evidence that they pass.

## 6. Device and instructional acceptance

| ID | Platform/activity | Required outcome |
| --- | --- | --- |
| D01 | Landscape tablet/phone Safari/WebKit and installed iOS PWA | Readable Simplified glyphs with `lang="zh-Hans"`, reviewed pinyin tones, no overflow, visible controls |
| D02 | Finger/stylus tracing, palm and interruption/exit | Usable input; no automatic quality/stroke score; all stroke buffers discarded |
| D03 | Matching/order via tap alternative; screen reader/keyboard | Equivalent accessible path; no timed penalty |
| D04 | Airplane mode, app kill/relaunch, cache update, low storage | Clear readiness/save/recovery messages and retained valid work where storage survives |
| D05 | Child uses lesson with reading/instruction assistance | Private observation distinguishes navigation/reading friction from concept evidence; no attention diagnosis |

Physical iOS/PWA behavior and mainland connectivity require actual-device/network evidence; Chromium or desktop WebKit emulation alone cannot certify them. Private usability notes and outcomes remain off GitHub. One-family observations support product iteration, not causal efficacy claims.

## 7. Design review and handoff gate

Claude reviews the Draft PR head and records findings with severity, exact section, consequence and smallest proposed fix. Prioritize eligibility/reset semantics, content independence/inventory, recurrence deduplication, delayed schedule feasibility, restore-derived state and publication privacy. Distinguish owner-confirmed requirements from proposed thresholds. Review is pending until Claude posts it; neither assistant may invent approval.

Before implementation: resolve material policy decisions, obtain scoped authorization, and satisfy the private coverage gate for import and data-protection/backup gates for real-record handling. Full Pilot completion still requires the remaining three instructional units. No merge/deployment/backend work is authorized by this specification.
