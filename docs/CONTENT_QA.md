# Turtle Academy — Content QA and Privacy Gates

**Status:** Conditionally ratified Pilot documentation, 2026-10-11, Issue #3. Not evidence of implemented tests or completed reviews.

## Curated educational content

- Every public lesson/question requires a stable versioned ID, objective and source/reference, task type, reviewed valid answers/variants where objective, explanation, hints, pedagogical rationale and original/licensed provenance. Do not reproduce teacher worksheets or proprietary textbook passages.
- Development-time AI assistance may draft and cross-review educational content, but AI agreement is not correctness. **Owner reviews every item** and audits **every disputed/ambiguous item**, plus a random **1 in 5 (20%)** sample of items where both AIs agree, per batch. Escalate to a qualified educator whenever the owner cannot resolve an ambiguity. Record a public-safe review log of generic item IDs, review outcome and licence evidence.
- A low-cost content validator must check schema, unique IDs, references, answer key and explanation completeness; it cannot validate pedagogy or copyright by itself.
- Development-time AI-generated artwork requires a dated provenance record (tool, terms/licence review, human edits, originality/third-party IP assessment); no copyrighted franchise reproductions.

## Private worksheet processing

- Parent crops identifying detail before providing images to a **private** Claude/ChatGPT account. Cropping reduces risk but does not guarantee anonymity; service-specific data handling terms apply.
- External AI prepares structured candidate targets, error type and uncertainty. Parent reviews and accepts/rejects every item before a parent-only paste-in import. **Only the registered child's authenticated private bank** holds actual errors, including verified, uncertain and unmatched/pending-content entries. No source image upload to Pilot app/backend and no runtime AI/OCR.
- Repeat occurrences preserve learning observations; no unverified inference of a knowledge misconception from an isolated wrong response. Only verified targets with reviewed catalogue exercises generate targeted practice.
- Real worksheets, errors, handwriting, progress, school data and identifiable records never enter public Git, Issues, PRs, screenshots, code fixtures, CI, logs or builds. Use synthetic examples for all validation.

## Learning and release integrity

- Distinguish objective correct/incorrect, ungraded, child self-reviewed, parent-reviewed and game/lesson completion. Do not equate any one signal with mastery.
- Use independently reviewed, varied items for immediate understanding and delayed retention around days 1, 3, 7 and 14; avoid punitive missed-day consequences and unsupported claims of causal efficacy.
- Check Simplified Chinese glyphs (including `lang="zh-Hans"`), pinyin tones and accessibility on target landscape phone/tablet and Safari/WebKit PWA.
- Before real records: verify Auth/RLS negative cross-family tests, identity linking, safe snapshot conflict and restore handling and correct staging/production separation, using synthetic-only fixtures. Test offline use after first online login.
- This document approves no implementation, merge, backend configuration, deployment or spending.
