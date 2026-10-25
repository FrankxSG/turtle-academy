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

## Historical research method — 16 October 2026

Shared conventions for the four dated subject audits. These describe the historical survey, not current batch approval or new procedural gates. Subject-specific findings, files, pages, hashes, retrieval failures and corrections remain in each preparation guide. In the retained paragraphs below, “above/below” refers to the calling subject audit; pending states describe the audited revision, not current approval.

<a id="audit-method-1"></a>

The reviewer independently retrieved public official PDFs, navigated current public school sources, downloaded actual historical paper packets, and examined dated enrichment. This is additional research beyond the previous targeted key corrections and the PR author’s source list. Paper text/OCR was processed across the individual packets; representative question pages, headings and selected rendered pages were examined for skills, response demand and date/course identity. External answer schemes were not assumed correct. The work is a source/scope/coverage audit with targeted item findings, not a second human marking of every external question or signed educator approval of every app key.

<a id="audit-method-2"></a>

The four audits together use **50 retrieved paper/bundle files**: 47 individual/combined packets and three second-host bundles. Files/hosts may overlap in underlying papers. Only eight pages of each large second-host bundle were examined; there is no claim to have manually audited the complete bundles. Public hosting is not a reuse licence or authentication of a school-issued paper. No source scans, passages, question text, images or answer sheets are added to the repository. No private worksheets or learner data were used.

<a id="audit-method-3"></a>

Official sources define scope; school sources corroborate local sequence/assessment, and hosted past papers/enrichment describe practice. Lower-authority sources do not override current MOE requirements. All page numbers below are PDF pages unless explicitly called printed pages. All sources accessed 2026-10-16.

<a id="audit-method-4"></a>

The school PDFs were reached through current school navigation; moved legacy file links were not silently counted as retrieved. They are public curriculum documents, not any learner’s school/worksheet information.

<a id="audit-method-5"></a>

Citation revision (2026-10-16): third-party past papers are linked through public listing pages only. School/year/type, analysis pages and original file hashes still identify the copies examined; this citation format does not establish reuse rights.

<a id="audit-method-6"></a>

“Retrieved” means a public PDF packet was downloaded and its content examined, not that a direct school release was authenticated. ¹ Catalogue year is not internally established for every packet; retain the per-file qualifications below. This was a bounded multi-host survey, not an exhaustive census. No verified 2026 paper was retrieved as of 2026-10-16; a website’s 2026 title/footer was not treated as the year printed on a paper.

<a id="audit-method-7"></a>

SGExam/SGTestPaper/SmileTutor and public web searches were checked. The second-host bundle below was actually sampled, not counted from an index alone. Multiple hosts can contain the same underlying paper; downloads are not a count of independent schools.

<a id="audit-method-8"></a>

For past papers, start at the cited public listing, identify the recorded grade/course, year and assessment, and obtain the matching file under the host’s current access conditions. Compare its `sha256sum` with the recorded hash; a mismatch may mean the host replaced the file. Official and other source snapshots are likewise identified by their cited URLs and hashes. For paper structure, extract native PDF text and OCR scans (PyMuPDF + Tesseract English / Simplified Chinese), then inspect the stated PDF pages and course/year covers visually where OCR is ambiguous. HTML hashes identify the fetched snapshot, not an immutable future webpage. The documented overlaps used only stems/material bodies, not keys/explanations or character catalogues. Source retrieval and OCR happened outside the public repository; no signed download tokens or private files are required to follow these citations.

<a id="audit-method-9"></a>

1. Resolve the numbered findings above and update the leaf-level map and affected content/metadata together. Keep the agreed Pilot exclusions and locks.
2. Review original questions, distractors, keys, hints, explanations and any new assets as a coherent batch; increment affected content versions and preserve prior pinned attempts. The earlier correction commit is not approval of unchanged or newly added content.
3. Re-run schema/content checks and the public-data guard. Validators check structure and references, not curriculum truth, unambiguous meaning, complete transfer pools or educational quality.
4. Calculate release coverage only from the reviewed in-scope leaf denominator, with explicit omissions. Independent review and owner sign-off remain pending; no percentage or question count authorises implementation/merge.

<a id="audit-method-10"></a>

Validation for this evidence-only revision: public-source link/hash and report consistency checks; subject content validator rerun without content/schema changes; privacy guard and whitespace diff check. The PR comment records the published evidence revision and exact results.
