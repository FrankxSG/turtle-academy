# Turtle Academy — Learning Pilot v0.1 Scope

**Document type:** Confirmed initial delivery slice  
**Audience:** Private, single-household learning trial; **no public beta or user registration**  
**Status:** Scope confirmed; implementation and real-device acceptance must be verified separately  
**Decision date:** 2026-10-10

## 1. Position within the project

Turtle Academy is a long-term, four-subject learning and adventure product. **Pilot v0.1 is intentionally only a small subset of that complete design**, created to test whether the instructional approaches are usable, engaging and educationally valuable before investing in full game and family-management systems.

Read this document together with:

- [`TECHNICAL_DESIGN_DECISIONS.md`](TECHNICAL_DESIGN_DECISIONS.md) — authoritative engineering, privacy, security and publication requirements.
- [`FEATURE_SCOPE.md`](FEATURE_SCOPE.md) — complete confirmed four-subject product and educational scope, including English E1–E12 and Mathematics M1–M12. Features omitted from the Pilot **remain in the target scope**, subject to later release prioritisation.

The numbered cross-subject decision sequence ended at **#202**; separately confirmed English and Mathematics decisions use **E1–E12** and **M1–M12**, respectively. Decision identifiers are not a total feature or question count.

## 2. Pilot objective and success conditions

Build the **lowest-cost genuinely playable four-subject learning trial**. Each subject needs an instructional loop, not just a subject button or static demonstration. Evaluate:

1. Whether the learner can independently start and finish meaningful lessons across four subjects.
2. Whether guided explanation, practice, objective feedback and a short review are useful and understandable.
3. Whether the four subject-specific teaching approaches warrant deeper content investment.
4. Whether progress and drafts persist reliably and all bundled content works offline after initial installation/caching.

Pilot success does **not** require full game engagement systems, long-term growth analytics, account creation or proof of educational impact from a short trial. Any observations of learning should be framed conservatively.

## 3. Agreed minimal delivery boundaries

| Area | Pilot v0.1 | Deferred; not cancelled |
|---|---|---|
| Users | One household, one local learner profile on a designated device; no public signup | Family accounts, multi-child profiles, invitations and public onboarding |
| Authentication | **No login required** | Email/password and optional Google login; Google alone does not provide cloud backup |
| Storage | **IndexedDB** stores activity state, answers, minimal error history and drafts | Supabase-authenticated storage, backups, private file storage and cross-device reconciliation |
| Hosting | Low-cost static PWA with initial content bundled/cached | Larger lesson-pack downloads, account-aware online services |
| Learning | A small reviewed task flow and deterministic checks for objectively markable responses | Full adaptive progression, diagnostics and multidimensional longitudinal mastery |
| Errors | Question ID, concept tag, verified result, hint usage where available and manual review/retry | Full personal mistake bank, worksheet import, sophisticated spaced practice and causal diagnosis |
| Parent | Simple local progress/review summary; adult supervises device use directly | Dashboard, PIN, time controls, weekly plans, parent letters and advanced oversight |
| Game | Friendly home, subject selection, light story prompts and **at most one guiding companion** | Full animal roster, game economy, fantasy map, garden, collections and complex quests |
| AI | **None in the app** | No runtime AI feature is planned under the current architecture decisions |
| Personal information | No authentic learner information in Git, static assets, CI or preview artifacts | Private learner records may only be supported through designed and authorised storage |

**Important:** A deployed public URL may be accessible to others even though the Pilot is only intended for private family use. Therefore, every committed lesson, fixture and bundled demo must be synthetic or generic and suitable for publication. Device-local progress must never be hard-coded into distributable files.

## 4. P0 implementation checklist

| ID | Deliverable | Acceptance boundary |
|---|---|---|
| P0-01 | Four-subject landing page | Access Science, Chinese, English and Mathematics; each leads to one complete unit. |
| P0-02 | Minimal shared task components | Build only required interactions (e.g. multiple choice, matching, ordering, short text/numeric response), with accessible non-drag alternatives where applicable. |
| P0-03 | Reviewed content format | Stable unit/question IDs, pedagogical intent, version, reviewed answer/explanation and appropriate hint; no copied worksheets. |
| P0-04 | Objective evaluation | Deterministic scoring only for objectively markable inputs. Unstructured explanations, journals and creative writing stay ungraded or self-reviewed. |
| P0-05 | Guided learning flow | Stage-by-stage progression and return to unfinished lessons; no full adaptive planner. |
| P0-06 | IndexedDB persistence | Save attempts, current step, drafts and small review history; refresh/interruption must not wipe work. |
| P0-07 | Minimal error tracking | Record wrong objective answers and associate knowledge tags; distinguish unverified guesses about error cause. |
| P0-08 | Simple re-practice | Let the learner retry prior mistakes, with basic feedback; no automatic worksheet ingestion or complex algorithm. |
| P0-09 | Local progress summary | Activities completed, verified objective results and items to revisit; completion is not equivalent to mastery. |
| P0-10 | Light child-friendly presentation | Simple home, short story context and a guide character; no coins, inventory, elaborate world or required daily streak. |
| P0-11 | Offline readiness | With content loaded and cached, each unit works through navigation, refresh and local save without a network connection. |
| P0-12 | Safety, original content and low-cost QA | No runtime AI, private student data, production credentials or unlicensed materials in build/tests; targeted smoke tests without unnecessary CI usage. |

## 5. Exactly four first instructional units

### Science — Living & Non-living Things

- The **first Science World unit** is *Living & Non-living Things*; *Magnets* is not the Pilot's first unit.
- Provide a compact **Discover → Investigate → Understand → Apply → Master** sequence using classification, observable evidence, key scientific language, contrasted cases and explanation scaffolds.
- Include objectively checkable questions and a light self-reviewed explanation or observation record. Distinguish observations from inferences and avoid automatic scoring of open responses.
- Verify curriculum alignment before presenting a specific learning objective as belonging to a particular lower-primary syllabus chapter; do not invent experiment observations.

### Chinese — Character & Word Repair

- Provide a small, original/reviewed bank of approximately **10–15 example target characters or words** for recognition, meaning, character distinctions, collocations and sentence context. This number is a content planning guide, not permission to fabricate real learner errors.
- Support a simple, local record of review and wrong objective answers. For distributable lessons and tests use **synthetic/general examples only**, never identifiable learner work.
- Personal worksheet photo uploads, OCR, auto-updating a full mistake bank, handwriting quality grading and production learner-record import are **out of Pilot**.

### English — Mystery in the Forest

- One **original narrative** Integrated Literacy unit: **Read → Think → Learn → Write → Improve**.
- Include reading comprehension, textual evidence and inference, precise vocabulary, sentence revision and one short paragraph or guided story-writing opportunity.
- Provide human-written examples and focused self-review; save drafts locally. Never claim the app automatically scored original writing for quality or creativity.
- Additional nonfiction units, deeper E1–E12 pathways and full writing portfolio remain part of `FEATURE_SCOPE.md`, not Pilot P0.

### Mathematics — Fractions

- One introductory **CPA (Concrete–Pictorial–Abstract)** learning sequence, including manipulable/visual fractions, part–whole meaning, comparison and appropriate equivalence examples.
- Use the compact **Understand → Apply → Reason** learning structure, objective checks and an age-appropriate explanation/reasoning challenge.
- Provide simple retry/verification but no automated grading of free-form reasoning or mathematical proof.
- Whole lower-primary coverage, larger heuristic libraries, the five applied maths environments and full M1–M12 depth stay in long-term scope.

**Content rule:** One substantial, coherent, reviewed unit per subject. Avoid implementing a generic authoring system or inflating item counts simply to look complete.

## 6. P1 and later release planning (provisional)

**P1 — Usable family version:** Add further units, secure family identity where needed, private Supabase records with RLS, reliable backup/sync, expanded mistake-bank management, practical parent oversight, more robust offline handling and a richer companion experience.

**Phase 2 candidates — deeper learning:** Broader Singapore lower-primary curriculum, advanced Science journal and experimentation, Chinese customised repair, English nonfiction/creative-writing sequence, Mathematics modelling and strategy banks, evidence-based diagnostics, spaced reviews, adaptive progression and parent learning plans.

**Phase 3 candidates — expanded adventure and portfolio:** More animal companions and story worlds, garden/museum, sustained research activities, richer learner portfolios and longer-term performance views.

**Backlog:** Optional cosmetic depth, hidden side quests, large content-authoring systems and other low-priority embellishments. **Only Pilot P0 is committed in this document; later phase assignment is indicative, not a change to the full confirmed feature scope.**

## 7. Testing and release gates

1. **Learning:** Each subject has usable instructions, a complete content loop, feedback and short review. A learner can complete and revisit all four units.
2. **Offline:** Test installation/initial cache, disconnected navigation, refresh, answer submission, draft retention and a return visit on intended hardware.
3. **Resilience:** Handle IndexedDB denial/unavailability and browser data loss clearly. Local device storage is **not** a durable private backup.
4. **Accuracy:** Review every answer key, pedagogical explanation, source licence and syllabus claim. Treat unscored writing as unscored.
5. **Privacy:** No real worksheets, names, school information, handwriting samples, personal history, credentials or production exports in repository files, bundles, CI artifacts, PR comments, screenshot fixtures or preview outputs.
6. **Security:** If a cloud learner record feature is added later, design and verify authentication, object access and per-learner RLS **before** transmitting any real data.
7. **Budget:** No unapproved paid plan or service. Avoid unnecessary CI triggers, duplicate jobs and costly cross-browser matrices in the Pilot.
8. **Publication:** These Markdown specifications may be included in a public repository after document-level review. **Making any repository that has held private material public requires its own full history/secrets/refs/preview audit** under `TECHNICAL_DESIGN_DECISIONS.md`, or a new clean repository.

## 8. Change-control rule

Pilot v0.1 is a deliberately restricted **delivery subset** of Turtle Academy. It does not remove the full Science and Chinese teaching scope, English E1–E12, Mathematics M1–M12, authenticated architecture, privacy controls, parent functions or future adventure-game requirements. Any proposal to change a confirmed long-term decision must be recorded explicitly; mere omission from Pilot does not constitute cancellation.
