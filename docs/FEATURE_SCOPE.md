# Turtle Academy — Full Feature Scope

**Document type:** Long-term product and curriculum specification  
**Status:** Confirmed feature directions and curriculum choices; not a release checklist or implementation report  
**Last scope consolidation:** 2026-10-15 (Pilot documentation alignment; full scope preserved)

## How to use this document

- This document describes the **complete target feature scope** for Turtle Academy across Science, Chinese, English and Mathematics. It does **not** mean every feature belongs in the first release, is already implemented, or has an assigned delivery date.
- [`TECHNICAL_DESIGN_DECISIONS.md`](TECHNICAL_DESIGN_DECISIONS.md) is authoritative for architecture, security, privacy and engineering constraints.
- [`PILOT_V0_1_SCOPE.md`](PILOT_V0_1_SCOPE.md) defines **the confirmed first delivery subset** for a family-only learning trial; deferring a feature in the Pilot does not remove it from this full scope.
- Numbered cross-subject design choices ended at **#202**. The reference number is a decision identifier, **not** a count of total questions or features. No higher-numbered cross-subject decisions are confirmed. The separately agreed English **E1–E12** and Mathematics **M1–M12** choices are recorded in full below.
- Future post-Pilot release priorities require separate confirmation; labels such as Phase 2 and Phase 3 must not be inferred from the feature list itself.

## 1. Product vision and child experience

Turtle Academy is an original 2.5D fantasy-adventure PWA blending narrative, animal companions and primary-school learning. Initial subject priorities include Singapore lower-primary Science preparation and Chinese character/word and handwriting improvement based on privately reviewed evidence. An underlying objective is stronger careful observation, instruction following, self-monitoring and optional classroom transfer without diagnostic claims. English and Mathematics are included in the confirmed four-subject long-term scope. No in-app AI, advertising, public chat or paid virtual currency.

### World navigation and story
- Original character and animal-led world; child-friendly home hub, subject worlds, free exploration, thematic maps and narrative quests.
- Science subject themes live in distinct fantasy areas (#156), with a world-long story, chapter stories, and optional side missions (#157). Meaningful but small local quest branches reconverge (#158).
- Hidden cross-chapter science puzzles/secrets (#159), adjustable exploration hint tiers via companions (#160), simple task list rather than complex quest investigation board (#161), map markers support click-to-auto-move while secrets remain hidden (#162).
- Multiple active quests, one tracked focus quest (#163); returning child can resume or skip short recap (#164); story/puzzle complexity and academic difficulty adapt independently (#165).
- Ten companion animals with distinct friendship levels, roles, cosmetics, feeding/rest and home play. Their care does **not** degrade while away; decoration and leisure must not coerce screen time.
- Home upgrades, pet habitats, costumes, science museum, trophies, study room, private gallery, mini-games, garden and collectible decoration. Coins/awards reflect genuine learning progression, not erroneous responses or purchases.

## 2. Learner experience and accounts

- PWA runs on tablet, desktop and landscape phone; optional tap-to-place for drag tasks, audio replay and adjustable text/animation/input pace (#166–169). Personal preferences sync for registered child; device-specific ergonomics may vary.
- Registered parent login: invitation-only, expiring code, email/password or Google (where usable), parent PIN, multiple child profiles, private sync. Guest can freely explore local-only with intentionally restricted personalisation. Selected guest progress can be migrated with parent review.
- No runtime AI involvement in teaching, scoring, OCR, voice or content generation. Human/curated educational assets and rule-based feedback only.
- Offline downloadable lesson packs, locally playable adventures and eventual authenticated sync; privacy and connectivity considerations (including restricted connectivity in mainland China) are in the technical decisions.

## 3. Core learning model and general assessment

- Personalized tasks combine curriculum sequence, mistakes, spaced repetition, concept readiness, learner interests and parent priorities.
- Separate chapter adventure completion and verified knowledge mastery (#127). Wrong answers help diagnose misconceptions without punishing gameplay; sufficient prior concept evidence required for genuinely advanced learning (#153–154).
- Lesson content aligned to published Singapore MOE curriculum after source verification, human editorial review and versioned IDs (#145–146). Layered chapter releases (#147), with an approximately 5–6-chapter initial longer-term release target (#148), distinct from the Pilot's scoped curriculum coverage; confirm latest lower-primary sequence (#149) and balance syllabus coverage with attractive interaction (#150).
- Story-led onboarding assessment and ongoing low-stakes recalibration (#151), optional skip/retest under parent control (#152).
- Learning feedback includes scientific keywords, explanations, visual tasks, misconceptions and adaptive repetition. Do not equate task submission or self-reported checklist with validated correctness.

## 4. Science World: chapters, learning flow and science skills

### Content themes and progression
- Initial topic shortlist: Living & Non-living Things / living classification, materials, life cycles, magnets; exact sequence and approved syllabus fit subject to current MOE verification.
- Each science chapter features **Discover → Investigate → Understand → Apply → Master** (#126); phases may be short at launch and deepened over time.
- Science Discovery Journal (#128), concept relationship map and interdisciplinary challenge (#129), optional multiple-day projects (#130) with child choosing from predefined options (#131), Science Museum for accomplishments (#132).
- Science words embedded in observation, experiment and explanation (#133). Misconception activities use contrasting evidence and guided revisions (#134); Master is a contextual application challenge (#135). Scientific skills report separately (#136) with longer-term evidence and cautious confidence in mastery (#137); natural checks plus targeted micro-assessments (#138).

### Scientific inquiry
- Guided investigation: question → prediction → fair experiment design → observation → scientific explanation (#121); playground or virtual lab + safe offline household science tasks (#120).
- Prediction/testing/reflection cycles, unexpected findings handled neutrally (#139); fair testing controls variables (#140); scientific detective differentiates observation/inference/conclusion (#141).
- Data collection/graphs and chart interpretation (#142), measurement, units and inaccurate measurements (#143), age-appropriate safety rules and adult checks (#144).

### Garden-based science (#183–190)
- Habits garden grows with long-term learning, unlocks for stable learning, knowledge mastery, mistake improvement and milestones, with free decoration (#183–184).
- Garden allows gentle voluntary tending and animal visits. **Science growing lab is independent of decorative garden**, so experiments show scientifically plausible effects without penalising children for time away (#185).
- Fast simulated growth and long-term real-calendar observations (#186). Journal differentiates **system simulation, actual child observations, and child inference**; missed days are not fictionalized as witnessed observations (#187).
- Record corrections retain original value, update time and reason; child distinguishes transcription issues, measurement variation and real change, then regenerates charts/interpretation (#188).
- Repeat tests and measurement checks, examine inconsistent values and improve fair experiments; do not demand advanced statistics at this level (#189).
- Transfer inquiry to different phenomena plus optional real household experiments; compare real and simulated outcomes (#190).

### Authentic offline observations and discoveries (#191–193)
- Children submit a brief record; for ordinary safe tasks parent review/comment/confirmation is **optional**; rewards can be granted on adequate submission. Adult-supervised experiments must be labelled for safety (#191).
- Children can independently record nature/everyday science discoveries, questions and basic explanations in a private theme-based collection; scripted companion prompts; selected items displayed in study or museum (#192).
- Manual science-theme tagging links journal entries to curated matching lessons, experiments and concept cards (#193). **No automatic follow-up question backlog** was selected in #193; keep this distinction from option C.

## 5. Science Discovery Journal and scientific expression (#194–200)

- **#194 B:** activity-specific structured templates: Everyday Observation (saw/wonder); Experiment (question/prediction/method/results/conclusion); Detective (evidence/inference/explanation); Data Investigation (measurement/chart/finding).
- **#195 C:** step-by-step companion guidance and free-fill mode, interchangeable without losing content; progressive scaffolding.
- **#196 B:** typing, hand-drawn observation via touch/stylus, numerical tables and simple charts; **do not add advanced diagramming suite from unchosen option C**.
- **#197 B:** fundamental scientific drawing instruction, labels, critical features, observation vs imagination, self-checklist; **no required first-versus-second drawing exercise from unchosen C**.
- **#198 C:** progressive scientific reasoning: select keywords, complete explanations, compare quality, explain independently, revise. Answer/reason/evidence used appropriately to task, never rigidly for every question.
- **#199 B:** initial free answer → graduated curated hints → compare human-written reference answer → revise; preserve edits, no automatic correctness assertion. **Parent review rubric from unchosen C is not required by this item** (parent feedback exists elsewhere where independently confirmed).
- **#200 B:** track initiation, hint dependence, self-check/revision and novel-context explanation behaviour, not correctness. **No mandatory parent scoring rubric from unchosen C**.

## 6. Chinese World: targeted repair and handwriting

- Support parent-reviewed early-primary Chinese learning evidence **held outside the repository**; derive private, verified wrong-character/question/phrase entries while distinguishing knowledge errors from possible slips and handwriting observations. Teacher marks and actual learner errors are prioritised with human verification.
- Personal mistake bank for **registered** accounts: wrong characters, type of error, learning concept, review schedule, new mistakes from gameplay and parent-curated adjustments; spaced repetition and progressively varied practice. Guest learning may keep a small local-only answer/review history, but has **no registered, cloud-synced personal mistake bank**.
- Chinese interactive units: character recognition and meaning, handwriting strokes and tidy form, word selection, writing practice, comprehension, listening/oral tasks, focused review; targeted print-friendly handwriting/revision sheets.
- Writing devices: finger, stylus, pen-and-paper printouts; no machine-vision or AI handwriting grading. Auto-save active draft locally, cleanup stale drafts after notice, preserve selected finished samples in private portfolio (#170–175).
- Carefully distinguish actual knowledge mistakes from presentation neatness and possible inadvertent slips; do not stigmatise a child as careless.

### Recurring private worksheet-to-mistake-bank workflow

The parent may use a private ChatGPT/Claude account to prepare structured candidate characters/words and mistake classifications from newly completed, cropped/redacted worksheets; the AI provider receives that content subject to its terms, and cropping does not guarantee anonymity. Each candidate must be human-reviewed before import into the **Registered** Child's private mistake bank via a parent-only paste-in screen. Keep verified, uncertain and unmatched private records; only verified catalogue-matched entries generate approved practice. Catalogue-unmatched targets are retained privately as pending content, while public generic catalogue growth is curriculum-based and original/licensed. Original worksheet images stay outside the Pilot app/backend and all public Git/development artifacts. The app does not use runtime AI, OCR or automatic handwriting grading.

## 7. Focus, instruction-following and classroom transfer (#201–202)

- **#201 C:** embed attention in learning: before task identify key focus, during task practice observation/step tracking/attention recovery, after task brief voluntary self-monitoring; optional strategies for classroom use. Do not assert whether child was truly attentive or promise school transfer.
- **#202 C:** two-step → three-step → conditional → integrated directions, in Science/Chinese and quests; before execution child can repeat/order cards, during execution proactively check/replay guidance, optional classroom application of “listen → remember key steps → act.” No time pressure or penalty for rechecking.

## 8. Parents, safety, portfolios and motivation

### Parent oversight
- Parent Dashboard: learner details, concept mastery, review trends, weekly/monthly reports, optional task priorities, activity and answer logs, and rule-based educational suggestions. Adult controls daily learning goal, screen/leisure time, safeguarding and parent PIN. Mastery claims require sufficiently reliable evidence; open-ended work is not automatically graded.
- Optional offline-task record review and supportive feedback without making every activity an approval workflow (#191).

### Portfolio and family feedback (#170–180)
- Temporary handwriting/journal drafts auto-save locally; stale drafts are auto-cleaned only with prior notice. Registered users automatically sync learning **results**; raw handwriting remains local except deliberately selected samples (#170–172).
- Display favourite finished works in home and museum (#173). Compare a selected pair of before/after works and allow parent comments (#174). Export individual works or one-page side-by-side PDF; not an automatic bulky book (#175).
- Parent creates non-monetary private letters delivered by animal messenger at natural stopping point (#176–177), archived for reread and child favourites in home study/growth handbook (#178). No interruptions during active questions.
- Family co-sets one or two concrete weekly learning growth goals; child can see progress, unlock achievement badge (#179). Parent may change goal/difficulty at any time; preserve progress if unmet; next week's target suggestions (#180).

### Habit design and garden (#181–185)
- Flexible **weekly** learning habit progress and lasting cumulative milestones; no punitive daily streak reset (#181 C).
- Parent sets 2–7 weekly study days; deterministic system proposes changes based on actual behaviour, **never automatically applies them** (#182 C).
- Habits garden visually represents sustained growth; unused garden stays healthy and retains unlocked ornaments (#183 B).
- Different decoration lines correspond to habits, concepts, correction, and long-term milestones (#184 C). Voluntary care/pet interaction and independent experiment zone (#185 C).

## 9. Access, accessibility, and health boundaries

- No attention disorder diagnosis or focus-score labelling. No forced login streaks, punitive missed-day penalties, harmful overuse loops, public comparison/leaderboards, monetary gambling or child-to-child chat.
- Accessible alternatives for drag; audio repeat; input speed customization; study/leisure caps; offline course packs and clear connectivity messages; persistent progress handled by authenticated sync only for registered users.
- Any identifiable learner artwork, handwriting, worksheets, school details and learning histories must remain private. Never include learner data in public repositories, Issues, PRs, dev fixtures, public logs, artifacts, screenshots, bundles or deployments. Parent-initiated private ChatGPT/Claude worksheet preparation is permitted outside the app after suitable cropping/redaction and under provider privacy terms; that does not guarantee anonymity. No in-app AI receives learner data.
- Child-safe offline activities should specify tools, supervision, boundaries and real-world observation authenticity.

## 10. English World: confirmed E1–E12 curriculum decisions

The English track is designed for advanced lower-primary readiness and beyond-foundational literacy. These are **long-term instructional decisions**, not a requirement to deliver every element in Pilot v0.1. Instruction is authored/reviewed by humans, with no AI scoring of original writing.

| ID | Confirmed selection | Scope and educational intent |
|---|---|---|
| E1 | D — Integrated Literacy | Connect **Read → Think → Learn → Write → Improve**; reading drives composition and reasoning rather than isolated drills. |
| E2 | B — Narrative + Nonfiction | Use narrative and informational texts, narrative writing and evidence-based short responses. |
| E3 | B — Progressive Writing | Move from sentence to paragraph to complete lower-primary story through scaffolds, models and self-check; no AI grading. |
| E4 | C — Critical Reading | Inference, textual evidence, character/plot, perspective, fact vs opinion, author intent and evaluation of evidence. |
| E5 | C — Advanced Vocabulary & Language Craft | Precise words, meaning nuance, collocations, figurative language, sensory detail and transfer across contexts. |
| E6 | C — Advanced Sentence Craft | Appropriate lower-primary grammar, flexible sentence structures, clauses, cohesion, rhythm and editing. |
| E7 | C — Creative Storytelling & Narrative Thinking | Original ideas, character arc, perspective, emotion, foreshadowing, themes and meaningful revision, introduced progressively. |
| E8 | C — Critical & Inquiry-based Nonfiction | Source credibility, bias, compare texts, evidence sufficiency, inquiry questions and Science links. |
| E9 | C — Advanced Reasoning & Written Argument | Multiple pieces of evidence, logical chains, contrasting viewpoints, calibrated claims and concise supported answers. |
| E10 | B — Adaptive Reading Progression | Foundation/Developing/Advanced; adapt text complexity separately from inferential challenge, based on evidenced performance. |
| E11 | B — Model-based Revision | Human-reviewed before/after examples, focused self-check, one or two revision targets at a time and preserved drafts; no required parent-marking workflow. |
| E12 | C — Multi-dimensional Mastery, Transfer & Portfolio | Assess reading, vocabulary, language, writing and reasoning through unseen texts, cross-theme application, independent performance, writing portfolio and optional human observations; avoid automated scores for free writing. |

**English Pilot subset:** P2 + P3 textual/visual practice across eight approved families; P3 general practice is unlocked from the start using reviewed available content, while P3 mistake imports follow later; complete writing and oral practice external, listening deferred. Objective selected answers only. See [Functional Design](PILOT_FUNCTIONAL_DESIGN.md); the earlier single Mystery unit is superseded.

## 11. Mathematics World: confirmed M1–M12 curriculum decisions

Full lower-primary topic coverage and sophisticated mathematical reasoning are **target product scope**, with the Pilot's P2-only knowledge-point requirement defined separately. No opaque simulated mastery precision and no automatic grading of open reasoning.

| ID | Confirmed selection | Scope and educational intent |
|---|---|---|
| M1 | C — Integrated Mathematical Development | Combine lower-primary concepts, conceptual depth, problem solving and transfer. |
| M2 | B — Progressive Full Lower-primary Coverage | Plan complete lower-primary domains over time using **Understand → Apply → Reason**; pilot coverage can be narrow. |
| M3 | C — CPA + Mathematical Inquiry | Concrete–Pictorial–Abstract models and **Explore → Discover → Explain → Verify → Generalise** with age-appropriate conjecture and evidence. |
| M4 | C — Advanced Problem Interpretation & Modelling | Identify hidden quantities, distinguish sufficient/missing information, interpret multi-step word problems, work backwards and create mathematical questions. |
| M5 | C — Flexible Problem-solving Strategies | Bar models and heuristics: pictures, tables, patterns, backward working, guess/check, simpler cases; compare strategies and justify choices. |
| M6 | C — Mathematical Investigation & Proof Thinking | Patterns, hypotheses, counterexamples, examples versus general proof and age-appropriate justification; not formal advanced proof. |
| M7 | C — Fluency & Number Exploration | Number sense, flexible mental calculation, operations, estimation and inverse checking without speed pressure. |
| M8 | C — Strategic Multi-step Reasoning | Understand → Plan → Solve → Monitor → Verify, dependencies, forward/backward planning and efficiency; start with two-step problems. |
| M9 | C — Diagnostic Learning & Error Patterns | Distinguish conceptual, procedural, interpretation, calculation, presentation and possible slips; use repeated evidence before inferring causes and intervene with suitable teaching. |
| M10 | C — Multi-dimensional Adaptive Learning | Concept, fluency, modelling, reasoning, flexibility and transfer tracked by knowledge area using verifiable observations, not artificial percentages. |
| M11 | B — Applied Mathematics & Interactive Exploration | Real-world problems plus virtual shopping, garden design, measurement lab, time planning and data explorer; **not** the larger multi-topic family-project option. |
| M12 | C — Mastery + Transfer + Mathematical Portfolio | Unseen tasks, cross-context transfer, independent performance, delayed review, investigations, portfolio artefacts and optional human observations. |

**Mathematics Pilot subset:** All P2 knowledge points represented through objective practice; no typed answers or free-workings scoring. P3 Mathematics is locked, and no P3 Mathematics content needs authoring in Pilot. Confirmed post-Pilot phase: build a Mathematics teaching flow, then open P3. See [Functional Design](PILOT_FUNCTIONAL_DESIGN.md). The earlier Fractions-only Pilot is superseded; broader full-product depth remains later work.

## 12. Selected numbered cross-subject decisions

| Item | Choice | Final decision |
|---|---|---|
| 120 | C | Virtual science lab plus safe real-world inquiry |
| 121 | B | Guided inquiry stages, not fully free-form experimental design |
| 125 | A | MOE chapter-based curriculum orientation |
| 126–152 | Various | Science mastery, inquiry, journal, project, editorial quality and release decisions described in the relevant sections |
| 153 | A | Prerequisite concept verification before advanced learning |
| 154 | C | Targeted prerequisite repair without replaying whole chapter |
| 156–165 | Mixed | Subject worlds, quests, exploration, on-demand hints, adaptive gameplay as outlined above |
| 166–169 | B/B/C/B | Accessible input, child prefs and device-specific adaptation |
| 170–175 | B/B/B/C/B/B | Local drafts, sync selected works, portfolio, comparison, PDF export |
| 176–180 | B/B/B/B/B | Parent letters, favourites, joint weekly goals and flexible changes |
| 181–185 | C/C/B/C/C | Flexible habit milestones; parent-owned weekly frequency; multidimensional garden and science zone |
| 186–190 | B/C/C/C/C | Fast + longitudinal plants, authentic records, correction, reliability, transfer |
| 191–195 | B/C/B/B/C | Child-submitted real tasks, discovery collection, topic linking, journal templates, guided/free mode |
| 196 | B | Text + hand drawing + data/chart |
| 197 | B | Basic scientific diagram principles |
| 198 | C | Multi-stage complete science explanations |
| 199 | B | Graduated hints, reference comparisons and self-revision |
| 200 | B | Independent explanation behaviour tracking only |
| 201 | C | Self-monitoring and optional classroom transfer |
| 202 | C | Multi-step directions, repeat/check and optional classroom transfer |

## 13. Implementation dependencies

1. Core engine/content IDs/editorial QA → meaningful mastery, mistake reviews and content migrations.
2. Local-first persistence & PWA offline packs → journals, drafts, quest progress and offline operation where connectivity is restricted, such as mainland China.
3. Secure registration + profile identity + RLS + sync → personalised mistakes, parent letters, portfolios, analytics and cross-device continuation.
4. Deterministic feedback + scoped validated assessment → independent science expression tracking without AI or false mastery claims.
5. Game inventory/rewards/achievements → companions, home garden and milestone collections.
6. Parent safety and time policy engine → screen-time compliance for adventures, leisure and offline activities.

## 14. Scope, publication and data boundaries

- All learning assets committed to the repository must be original, permissively licensed or properly authorised for redistribution, with attribution and licence evidence where required. Educational materials obtained from teachers, schools, textbooks or worksheets are **not** presumed redistributable.
- Generic curricular examples and synthetic test cases may be public. Original learner worksheets, identifiable writing or drawings, learner answers, mistakes, progress, photographs, school identifiers and household documents must remain **outside Git and the public build**. Private records require appropriate authenticated storage when cloud features are enabled.
- The Pilot delivers Chinese first, then Science, Mathematics and English under [Functional Design](PILOT_FUNCTIONAL_DESIGN.md). Scope is P2 + P3 Chinese/Higher Chinese and English textual/visual outcomes, P2 Mathematics, plus the seven selected P3 Science topic areas. P3 language general practice is unlocked from the start; P3 language mistake imports follow later. Each subject has its own X=6–19, default 10. P2 language/Math coverage and Science's first-two-topic coverage use a 75% release guideline with a recorded owner override; full scoped coverage remains the goal and reviewed content remains delivery work.
- Features not selected for the Pilot remain part of the long-term scope where previously confirmed, but their schedule, budget, implementation readiness and educational outcomes are not guaranteed by this document.
- No runtime AI, automatic correctness claims for open writing/scientific explanations, punitive streak mechanics or unsafe encouragement to prolong children's screen time.
- Publishing a document that is safe to share **does not** by itself authorise publishing any repository or deployment. Any repository that has ever held private material needs a separate full-history, refs, secrets, CI artifacts, licensing and hosting-preview security audit under the technical decisions, or should be replaced by a new clean repository.
