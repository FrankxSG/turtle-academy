# Turtle Academy — Content QA and Privacy Gates

Question-quality and privacy requirements. Batch records hold actual reviews and sign-offs.

Current behavioral authority is [Functional Design](PILOT_FUNCTIONAL_DESIGN.md); [Learning Engine and Acceptance](PILOT_LEARNING_ENGINE_SPEC.md) defines scoped coverage and required future tests. Objective-only practice does not establish independent writing/oral/listening capability.

## Curated educational content

- Every public lesson/question requires a stable versioned ID, objective and source/reference, task type and format class (4+ option MCQ/matching/ordering versus true-false/2–3 option MCQ), reviewed valid answers/variants where objective, explanation, hints, pedagogical rationale and original/licensed provenance. Do not reproduce teacher worksheets or proprietary textbook passages.
- Development-time AI assistance may draft and cross-review educational content, but AI agreement is not correctness. **Owner reviews every disputed/ambiguous item** and a random **1 in 5 (20%)** sample of AI-agreed items per batch, then signs off each batch. Escalate to a qualified educator whenever the owner cannot resolve an ambiguity. Maintain a public-safe batch log with owner sign-off, curriculum source and version, AI cross-review status, sampled generic item IDs and review outcomes, licensing/source evidence and artwork provenance; never learner records.
- A low-cost content validator must check schema, unique IDs, references, answer key and explanation completeness; it cannot validate pedagogy or copyright by itself.
- Development-time AI-generated artwork requires a dated provenance record (tool, terms/licence review, human edits, originality/third-party IP assessment); no copyrighted franchise reproductions.

## Private worksheet processing

- Parent provides worksheet images to a **private** Claude/ChatGPT account without having to crop them first. The AI filters identifying detail (names, school, class, teacher comments, photos) out of everything it produces (owner decision 2026-10-18; this replaces parent cropping). The provider still receives the full image under its data handling terms, and filtering does not guarantee anonymity.
- External AI prepares structured candidate targets, error type and uncertainty. Parent reviews and accepts/rejects every item before a parent-only paste-in import. **Only the registered child's authenticated private bank** holds actual errors, including verified, uncertain and unmatched/pending-content entries. No source image upload to Pilot app/backend and no runtime AI/OCR.
- Repeat occurrences preserve learning observations; no unverified inference of a knowledge misconception from an isolated wrong response. Only verified targets with reviewed catalogue exercises generate targeted practice.
- Real worksheets, errors, handwriting, progress, school data and identifiable records never enter public Git, Issues, PRs, screenshots, code fixtures, CI, logs or builds. Use synthetic examples for all validation.

## Learning and release integrity

- Apply the [whole-material](PILOT_FUNCTIONAL_DESIGN.md#3-chinese-and-english-whole-material-tasks), [repair](PILOT_FUNCTIONAL_DESIGN.md#4-targets-repair-and-delayed-review) and [Science evidence](PILOT_FUNCTIONAL_DESIGN.md#5-science-initial-learning) rules and their [acceptance cases](PILOT_LEARNING_ENGINE_SPEC.md#7-behavioral-acceptance-cases).
- Subject coverage reports use the approved grade/course inventory. Initial Science coverage uses its first two topics; Mathematics is P2-only in Pilot, while Chinese/Higher Chinese and English P3 general practice is unlocked from the start using reviewed available content and P3 mistake imports follow later. The 75% guideline and recorded owner coverage override never waive source verification, rights, shipped-item QA, privacy/security or data-protection gates. Publish the versioned leaf curriculum manifest before accepting mapped extraction IDs.
- Necessary wrong forms remain device-local; exclude them and PIN/hash from cloud snapshots. App general-practice recurrence is separate from repair/review failures.

- Distinguish objective correct/incorrect, ungraded, child self-reviewed, parent-reviewed and game/lesson completion. Do not equate any one signal with mastery.
- Use independently reviewed, varied items for immediate understanding and the [confirmed delayed-review sequence](PILOT_FUNCTIONAL_DESIGN.md#4-targets-repair-and-delayed-review); avoid punitive missed-day consequences and unsupported claims of causal efficacy.
- Check Simplified Chinese glyphs (including `lang="zh-Hans"`), pinyin tones and accessibility on target landscape phone/tablet and Safari/WebKit PWA.
- Before real records: verify Auth/RLS negative cross-family tests, identity linking, safe snapshot conflict and restore handling and correct staging/production separation, using synthetic-only fixtures. Test offline use after first online login.
