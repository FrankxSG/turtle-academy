# On-device learning engine (Pilot build 2, Issue #17)

Runs entirely on the device with no backend calls. Authority: Pilot Functional Design §2–5 and §9, Learning Engine §2–4 and §6. Confirmed behaviour comes from those documents; the algorithms marked **proposal** below are engineering choices for review, not new product decisions.

| Module | Responsibility |
| --- | --- |
| `types.ts` | Record types mirroring the closed `pilot-snapshot/1` allow-list. Wrong forms and the PIN/hash have no field. |
| `policy.ts` | Confirmed constants: X 6–19 (default 10; Chinese up to 20 in the first pilot), review intervals 1/3/7/14/30/30, two clearances per target per day, Science 7-day filler exclusion, 2-minute idle, course locks. |
| `calendar.ts` | Learning dates in the profile timezone, with timezone-change guards. |
| `evidence.ts` | Reducer: stages, due dates, eligibility and unlocks are re-derived from the append-only events on every change. |
| `amendments.ts` | Parent amendments: how replay reads the add-only amendment log (corrected targets, invalidated targets, observations and answers). |
| `planner.ts` | Frozen task plans (X, content and policy versions, materials, formal total) and slot resolution when a question is shown. |
| `engine.ts` | Task flow, first response → hint/retry → correction, flags, story checkpoints, active time, local saving. |
| `persistence.ts` | Ordered, idempotent mutations, the save-failure queue and an in-memory store for tests. The Dexie store is in `src/storage.ts`. |
| `snapshot.ts` | Local-only export validated by the #16 validator; nothing is uploaded. |
| `legacy.ts` | Inspection of the old guest checkpoint, which never becomes child evidence. The native reader in `src/storage.ts` never creates, upgrades or writes the guest database. |
| `../catalogue/adapter.ts` | The content interface, versioned releases and objective judging. |

## Engineering proposals for review

- **Timezone guard.** For 24 hours after a change, the learning date is the earlier of the old- and new-zone dates, and it never goes backwards. Moving east cannot start a new day early; moving west cannot repeat a day. History is replayed with a running maximum, so every device derives the same dates.
- **Low-option evidence.** Partial low-option successes carry across tasks at the same stage until a wrong first response clears them. A low success can combine with whole-task successes for the threshold.
- **Short repair slots.** Each repair target gets two short slots (Mathematics and Science), resolved when shown. A slot falls back to another eligible target, then to general practice, then it is skipped (shortened completion).
- **Novel context.** A presentation is novel when neither the item nor another item of the same context was answered before for that target. Flagged, unanswered presentations don't count.
- **Flags.** An open or disabled flag excludes evidence from every presentation of that item version for this child. A parent restore re-includes them, except the replaced presentation itself. The same rule applies to app-caught mistakes: each observation records its source presentation (`batch_ref`) and task (`instance_ref`), and a target whose only observations come from invalid questions is not planned.
- **Target compatibility.** A question credits a target only with the same subject, course, knowledge point and exact assessed skill (no wildcard for a missing skill), from a pool for the target's stage (delayed checks use the generic pool). One rule serves material coverage, attachment, short repair and replacements.
- **Withdrawn slots.** A flagged or later-suspended slot with no replacement is withdrawn: help for the other answers in its material proceeds and the task completes with `replacements_exhausted`.
- **Late suspensions.** A suspended version is never served from a frozen plan. An unshown or unanswered presentation is replaced in place (inside its material, so feedback stays withheld); an answered one stays counted as done work, with its evidence excluded.
- **Parent amendments (F23/F51).** Amendments never edit the records they correct, so they converge through sync's add-only rules. `amendTarget` (imported targets only) adds a replacement target with the corrected knowledge point, skill or error type, the same observations (ids and provenance kept, `recorded_on` set to the correction day, so practice starts the next day) and no answers, so it inherits no success. `invalidateTarget`, `invalidateObservation` and `invalidatePresentation` (answers in finished tasks only; unfinished tasks use the child's flag) exclude records from replay. Replay applies amendments in (time, id) order: two devices that correct the same target keep both amendments and the later replacement wins; invalidating any version of a mistake invalidates it. Completions and story checkpoints are separate records and never change.
- **Same-day app errors** are all stored; repeats are labelled `duplicate` and collapse to one observation per day in the reducer.
- **Completion date.** A task's daily credit goes to the learning date on which it finalises. An optional extra task on an already-credited day earns no story checkpoint.
- **Science acquisition targets** are private target records with `error_type: none` and no observations. They are not mistakes.

## Known limits

- The Dexie store and the legacy guest boundary are exercised on real IndexedDB in Chromium by `tests/storage.spec.ts` (run in the Foundation workflow). Other browsers, in particular iPad Safari, are covered by real-device acceptance, not here.
- Snapshot `target_aggregates` and `eligibility` are recomputed caches. A short-route aggregate keeps at most two clearances, so a task spanning midnight that clears a third stage after midnight drops that entry from the cache, not from the events.
- Engine tests do not prove browser or service-worker update behaviour (F29 covers content pinning only).
- Out of scope here: UI (#18), paste-in import (F20, F34), and real content or learner data. Parent amendments (F23) are in `amendments.ts`; the parent area drives them. Live sync is in `src/sync/`: the engine only applies downloaded records (`applyRemote`, never re-uploaded) and gives daily tasks a deterministic id per subject and learning day.
