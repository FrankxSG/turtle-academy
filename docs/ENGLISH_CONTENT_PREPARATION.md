# English content pool (P2-P3)

**Current working state:** use the [canonical pool](../content/english/pool-001.json) review log and [curriculum](../content/english/curriculum.json) limitations for current status. Full item QA, owner disputed-item review/random 20% sample, rights and batch sign-off remain pending. A targeted preparation re-review is not a subject release. The [README](../README.md) distinguishes implemented app behavior from these authored pools.

## Current findings and next work

| Finding | Disposition / remaining work | Retained evidence |
| --- | --- | --- |
| EL1 | Ambiguity corrections authored; full item QA and sign-off remain pending. | [Correction history](#correction-revision--16-october-2026) |
| EL2 | Skill-specific reading/cloze repair routes authored, with later robot-cloze and cause/result corrections. | [Re-review disposition](#historical-authoring-and-review-overview) and canonical route records |
| EL3 | Source-complete leaf inventory and genre breadth remain open; objective recognition never proves independent spelling/writing/oral production. | [Audit response](#audit-response-revision--16-october-2026-batch-version-3) |
| EL4 | Whole-material aggregation and blank/question links remain required; source papers do not impose a fixed app exam pattern. | Same response; Functional Design §3 |

Historical research: [source audit](#research-audit). Shared review method: [Content QA](CONTENT_QA.md), [authoring skill](../skills/question-authoring/SKILL.md) and [review command](../README.md#content-preparation).

## 1. What is in this pool

- [Curriculum and source records](../content/english/curriculum.json): topic/leaf mapping, source metadata, scope and limitations.
- [Original content pool](../content/english/pool-001.json) and [assets](../content/english/assets/): canonical item/material versions, keys, repair routes and review state.
- [Shared validator](../scripts/validate_subject_content.py): schema, IDs/keys/references, complete stage routes, visual assets, knowledge-point links/prerequisite cycles, SVG safety and non-answer-revealing hints.

Use the [content-review command](../README.md#content-preparation) for current counts, source records and complete rendered items. This is original authoring; no paper/school/commercial question, passage or figure is copied. The pool remains author-checked with full item QA, independent review and owner sign-off pending; authored mappings are not approved coverage.

## 2. Sources cited

Historical authoring citations (16 October); the **direct-retrieval failures in their notes are author-stage results**. Later independent retrievals and file fingerprints are in the [research audit](#research-audit). Current machine-readable metadata is in the curriculum JSON; neither a later retrieval nor a count establishes complete leaf verification.

| ID | Type | Source | Used for |
| --- | --- | --- | --- |
| `moe-el-2020` | MOE official | [MOE English Language Syllabus 2020 (Primary)](https://www.moe.gov.sg/-/media/files/primary/2020-english-language-primary.ashx) (accessed 2026-10-16) | Authoritative areas of language learning and grammar/vocabulary scope. _Official MOE file; direct retrieval was blocked from the authoring environment, so content was cross-checked against school documents that follow it. Verify against the PDF during inventory audit._ |
| `acs-el` | School (public) | [ACS (Primary): English Language curriculum page](https://www.acspri.moe.edu.sg/our-curriculum/english-language/) (accessed 2026-10-16) | STELLAR approach context. |
| `shuqun-el-p2-2025` | School (public) | [Shuqun Primary: P2 English Handbook 2025](https://shuqunpri.moe.edu.sg/files/P2_English_Handbook_2025.pdf) (accessed 2026-10-16) | P2 grammar items by STELLAR unit (nouns, determiners, verbs, SVA, conjunctions, adverbs, prepositions, punctuation, sentence types); comprehension skills. |
| `yuhua-el-p2-2025` | School (public) | [Yuhua Primary: 2025 P2 Parents Engagement Handouts (EL)](https://yuhuapri.moe.edu.sg/files/2025_P2_Parents_Engagement_Handouts_EL.pdf) (accessed 2026-10-16) | P2 reading outcomes and holistic assessment. |
| `edgefield-p2-2025` | School (public) | [Edgefield Primary: 2025 P2 Learning Outcomes letter](https://www.edgefieldpri.moe.edu.sg/files/2025_Assessment_Letter_to_Parents___P2_Learning_Outcomes.pdf) (accessed 2026-10-16) | P2 English learning outcomes (tenses, connectors, sequencing). |
| `cedar-p3-2025` | School (public) | [Cedar Primary: P3 Curriculum Briefing 2025](https://www.cedarpri.moe.edu.sg/files/Parent%20Engagement/2025%20P3%20Engagement/3__14_mar_p3_curriculum_briefing_2025.pdf) (accessed 2026-10-16) | P3 EL paper format: grammar, vocabulary, punctuation, visual text MCQ; grammar cloze, editing, sentence combining, comprehension. |
| `jwps-p3-2025` | School (public) | [Jurong West Primary: 2025 P3 Assessment Overview, Topics and Components](https://www.jurongwestpri.moe.edu.sg/files/JWPS_2025_P3_Assessment_Overview__Topics_and_Components_.pdf) (accessed 2026-10-16) | P3 EL component counts (vocabulary 6, grammar 8, grammar cloze 8, editing 4, comprehension cloze 4, sentence combining 4). |
| `eliaspark-el-p3` | School (public) | [Elias Park Primary: P3 to P6 English Language Assessment Formats](https://www.eliasparkpri.moe.edu.sg/files/P3_to_P6_English_Language_Assessment_Formats_.pdf) (accessed 2026-10-16) | P3 grammar cloze focus (pronouns, subject-verb agreement), passage lengths. |
| `geniebook-p2-papers` | Past-paper index | [Geniebook: Primary 2 sample papers index (2021-2023 listed)](https://geniebook.com/exam-preparation/sample-papers/primary-2) (accessed 2026-10-16) | Format survey of P2 English practice/SA papers; no questions copied. _No stated reuse licence; format analysis only._ |
| `smiletutor-papers` | Past-paper index | [SmileTutor: primary school exam papers index](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/) (accessed 2026-10-16) | Format survey of P2/P3 English papers (2022 within range); no questions copied. _Site states copyright; format analysis only._ |
| `nlb-booklists` | Enrichment | [National Library Board: primary school book recommendations](https://www.nlb.gov.sg/main/site/discovereads/children/reading-recommendations/booklists) (accessed 2026-10-16) | Enrichment context: extensive reading. |
| `cdac-kidsread` | Enrichment | [CDAC: kidsREAD reading programme](https://cdac.org.sg/kidsread) (accessed 2026-10-16) | Enrichment context: reading support programme. |

## 3. Assessment formats observed (public school documents)

- **P2:** holistic assessment only; grammar is taught through STELLAR units. One school's 2025 handbook lists, by unit: nouns and noun phrases, determiners, verbs and verb phrases, subject-verb agreement, adjectives, adverbs, conjunctions, prepositions, punctuation and sentence types (`shuqun-el-p2-2025`). Reading outcomes: identify big ideas and recall the sequence of events (`yuhua-el-p2-2025`, `edgefield-p2-2025`).
- **P3 EOY Paper 2 (Language Use and Comprehension):** Booklet A MCQ on grammar, vocabulary, punctuation and visual text; Booklet B grammar cloze, editing for spelling and grammar, sentence combining and open-ended comprehension (`cedar-p3-2025`). Reported counts: vocabulary 6, grammar 8, grammar cloze 8, editing 4, comprehension cloze 4, sentence combining 4, two passages (`jwps-p3-2025`); grammar cloze focusing on pronouns and subject-verb agreement, passages of about 200-300 words (`eliaspark-el-p3`).
- **Implication for the app:** open-ended school formats (grammar cloze, editing, synthesis, comprehension) are presented with options. This tests recognition of the correct form, not independent production.

## 4. Past-year paper survey (2021-2026)

Geniebook lists P2 English practice and semestral papers for 2022-2023 (`geniebook-p2-papers`); SmileTutor lists P2/P3 English papers with 2022 in range (`smiletutor-papers`). Neither states a reuse licence, so **no paper, passage or question is reproduced**. The survey informed item styles only: one-blank grammar MCQ, vocabulary in context, cloze passages of about 5-8 blanks, notices and posters for visual text, and 4-5-question narrative and information passages.

## 5. Content notes

- All passages are original. Local settings (hawker centre, East Coast Park, wet market, Pulau Ubin) give familiar contexts without real people or schools.
- Grammar repair sets follow the Pilot ladder: **exact** (the rule in a simple sentence), **similar** (the same rule in a new sentence), **generic** (the rule in a fuller context).
- Writing-foundation items ask pupils to choose connectors, sensory details and "show, don't tell" sentences; free writing stays external.

## 6. Enrichment context (2024-2026)

Extensive reading is encouraged through NLB booklists and programmes such as kidsREAD (`nlb-booklists`, `cdac-kidsread`). Cited for context only; no text is copied.

## Topic coverage in this pool

Current inventory and review pages: [README content preparation](../README.md#content-preparation).

## Historical corrections

## Historical authoring and review overview

Independent public-source research and original findings: [research audit](#research-audit) (2026-10-16). The review disposition below records subsequent corrections; the historical audit remains evidence, not batch approval.

**Review disposition — 17 October 2026:** Independent re-review of `40aa8a4` closes the encoded-external-reference SVG finding. All six shared test methods and the subject validator pass. The prior acceptance of the robot-cloze routes, six new repair questions, cause/result route and P3 reinforcement remains valid. Pool v4 correctly identifies that revision, and the inventory now reports all 96 authored leaves. No open blocker from this correction remains for merging preparation work; this is not owner merge authorization or approved shipping content. EL3's source-complete inventory, full item QA, owner disputed-item review/random 20% sample, batch sign-off and coverage approval remain pending. Listening and full writing/oral exclusions are unchanged.

**Review proposal · 16 October 2026 · generic/public content pool**

Original P2 and P3 English questions and passages for the public (generic) version of Turtle Academy, across the eight approved exercise families (grammar, vocabulary, cloze, spelling/editing, sentence organisation, visual text, comprehension, writing foundations), with public sources cited. This document does not authorize implementation, release, merge or deployment.

The dated revisions below retain the defects, source interpretations and dispositions that inform authoring. Their old counts, pending states and implementation claims apply to those revisions, not current capabilities; use the current JSON and [README](../README.md). Shared human QA requirements are in [CONTENT_QA](CONTENT_QA.md).

## Correction revision — 16 October 2026

Batch version 2 corrects 29 disputed or related items. The market passage answer now states that the mother gave the auntie rambutans. Preposition questions gain a distinguishing stimulus or lose defensible alternative options; determiner questions no longer reject a valid `some` question. Present-tense prompts explicitly name the required tense, conjunction/synthesis prompts state the intended relation, valid alternative `although` sentences are replaced, and before/after order is explicit. The homophone-editing item now distinguishes a valid tree word from the intended seaside word; its task does not claim that `beech` is intrinsically misspelt. A hint that directly named water is also replaced. Revised item versions are incremented and IDs remain listed for independent re-review. Counts and material grouping are unchanged. Skill-level coverage/repair mappings, verified source pages, dated paper/enrichment analysis and owner sign-off remain open.

Existing tasks retain their pinned versions; these authoring revisions do not implement evidence migration or retroactive regrading.

## Audit-response revision — 16 October 2026 (batch version 3)

Responds to [ENGLISH_RESEARCH_AUDIT.md](#research-audit) EL1–EL4. Author revision only: every revised or new item is pending independent re-review and owner sign-off.

| Finding | Change in this batch | Still open |
| --- | --- | --- |
| **EL1** multiple-answer stems | `el-p3-when-while-before.q1`–`.q3` now state the purpose or timeline that fixes the answer: germs on food → *before*; "still in the shower" → *while*; "did not miss the ending" → *after*. `el-p3-sva-there.q1` uses an unambiguous plural noun phrase and a present-time cue ("two umbrellas … right now"), and *were* is no longer an option. `el-p3-although.q1`–`.q3` now state the contrast in the sentence ("did not stop", "limped across", "still helped"). | Independent review |
| **EL2** repair routes for passages | 14 new reading and visual-text skill targets (P2: find detail, find reason, feelings, sequence, word meaning, find information, use information; P3: find detail, find reason, inference, character, main message, find information, apply information), each with 3 new original mini-passages (42 items). Every one of the 91 material questions now has a `repair_target_id`. Comprehension and visual-text questions route to a skill target. Each cloze blank routes to the grammar or vocabulary target it tests (for example, the *went* blank routes to simple past irregular). | Repair choice is by skill, not by an inferred error cause. Reviewers should check the cloze-to-target routes. |
| **EL3** strength of coverage claims | `curriculum.json` limitations and leaves now state that the per-year list is a working inventory, not an MOE checklist. There is one leaf per repair target (MOE pp22/26/28/30, lower-primary band). Spelling and sentence production are `partial`, oral and composition are `external`, and listening is `deferred`. The four visual texts now include a drawn notice, so layout and emphasis are part of the text. | The leaf map is an author map and needs independent verification. The reading genres are still a starting sample. |
| **EL4** material aggregation | No fixed exam pattern is claimed. Aggregation rules: each formal question counts once toward X. Cloze blank *(n)* is question *n* in `question_ids` (the validator checks that each marker appears exactly once). Each question routes to its own repair target. Feedback is delayed until the whole material is answered, as in the Pilot design. | The engine compile step still has to implement these rules. |

Also changed: the P3 night-zoo leaflet and one new notice now use generic names, so no item appears to come from a real organisation.

## Re-review corrections — 17 October 2026 (batch version 4)

Responds to the independent re-review of `710c0a1`, which closed the robot-cloze route finding and accepted the six new questions, the volunteer "so" route and and/but/or as P3 reinforcement.
- **Pool version 4.** The previous round added the `el.p3.object-pronoun` and `el.p3.and-but-or` repair sets and rerouted two blanks, but did not raise the pool version. Item versions were already incremented. The inventory line above now shows the current counts.
- **Shared SVG guard.** Attribute values are now checked after XML decoding. Encoded `url(` and `https`, protocol-relative values, `data:` and CSS escapes are rejected, while same-file `url(#id)` stays allowed. The re-review's encoded probes are failing tests.

Still open: the source-complete inventory (deferred to the next round), item QA, the 20% sample and owner sign-off.


<a id="research-audit"></a>

## Research audit — 2026-10-16

Historical source evidence and findings, retained in full below. The preparation/review dispositions above record later corrections; this audit's old verdict and counts are not current approval status. The identifier `ENGLISH_RESEARCH_AUDIT` is retained for existing source references.

### English — independent public-source research and content audit

Audit date: **2026-10-16**. PR **#15**, reviewed head `9fa97d786e0380f87ca364581edd33bc0cae9b5f`; base `main` at `dc3ed51c5da07e3b2cec69eeacaac69e23daa1c8`. Research/evidence revision only; no content approval, implementation, merge or deployment authorization.

**Verdict: changes required before content approval.** All eight agreed format families are represented in adapted selected-answer form, but several standalone questions remain ambiguous, reading/cloze materials have no repair-target mappings, and broad topic counts do not establish full P2/P3 curriculum coverage.

Snapshot: 316 questions (166 P2 + 150 P3), 19 materials / 91 questions, 225 repair questions for 75 standalone targets. Full writing/oral assessment is external; listening is deferred. Choice-based editing or synthesis is narrower than independent spelling or sentence production.

#### Method and evidence limits

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-1).

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-2).

#### Content findings

##### EL1 — Resolve remaining multiple-answer stems (blocking for objective scoring)

| Item | Independent issue | Required next revision |
| --- | --- | --- |
| `el-p3-when-while-before.q1` | Washing hands before or after eating is grammatically meaningful; no specified time order determines the key | State the event order/purpose that the question tests |
| `el-p3-when-while-before.q2` | The call can happen before or during the shower; continuous aspect alone does not exclude “before” | Add an explicit overlap cue or remove the valid alternative |
| `el-p3-when-while-before.q3` | Going home before or after a film ends are both valid events | Supply the timeline/meaning to preserve |
| `el-p3-sva-there.q1` | A mixed-number list (“a bag and two umbrellas”) introduces agreement/register ambiguity; “were” is also possible without a time constraint | Use an unambiguous noun phrase and explicit time/form restriction |

The primary [Cambridge Grammar guide to time conjunctions](https://dictionary.cambridge.org/grammar/british-grammar/conjunctions-time) distinguishes temporal relationships; it does not make one unspecified sequence obligatory. Its [there is/are guide](https://dictionary.cambridge.org/us/grammar/british-grammar/is-and-are) also distinguishes agreement and conversational usage. Re-review `el-p3-although.q1`–`.q3`: intended contrast is plausible, but causal alternatives can form meaningful sentences unless the intended relationship is stated. Treat these as context-sensitive content review, not a universal grammar rule that the alternatives are ungrammatical.

##### EL2 — Make comprehension and cloze errors learnable (blocking before engine use)

All 91 material questions have no target/stage mapping. The 75 three-stage targets cover standalone grammar/vocabulary/editing/sentence foundations, not reading abilities. An incorrect inference, evidence-selection, sequence or cloze answer therefore has no declared three-stage route through new materials. Add skill-specific targets, assessed ability, supported error type and distinct-material stage pools. Selecting a distractor alone must not invent a psychological error cause.

##### EL3 — Correct the strength of coverage claims (blocking for release calculation)

MOE pp22/26/28/30 give progressing language capabilities and lower/middle primary bands, not an exhaustive official year-specific grammar checklist. The current 35 topic labels are a working school/paper-informed inventory. Map finer assessed skills, retain grade evidence and mark production/listening exclusions. Nineteen materials demonstrate a starting sample; they do not establish all reading genres or all vocabulary/grammar outcomes. Plain text notices test extracting information but do not by themselves prove interpreting visual design/multimodal cues.

##### EL4 — Preserve material completeness without claiming a fixed exam pattern

The inspected papers have three-, four-, seven- and nine-question materials, with variable subparts and marks. Five questions per app material is an acceptable authoring choice. X counts formal questions, not marks or blanks inferred from typography. Keep whole-material planning, delayed feedback and safe story boundaries; add explicit blank/question links and material/target aggregation when compiling these drafts to the engine contract. The authoring validator does not prove scheduling, feedback non-leakage or checkpoint timing.

#### Official and public-school sources

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-3).

- [MOE English Language 2020, Primary](https://www.moe.gov.sg/api/media/b8eb0437-67fb-4042-a26c-64fef2af12df/2020-english-language-primary.pdf). Actual PDF retrieved and inspected: PDF/printed p22 reading, p26 writing, p28 grammar, p30 vocabulary. SHA-256: `5738e831e71aa7b98a912013ba5a26b267f4a8f375c99a307426bd7724d24746`.

| School document | Pages examined / use | SHA-256 |
| --- | --- | --- |
| [ws-p2-2026-0](https://isomer-user-content.by.gov.sg/817/adccc9a3-e697-491d-b293-803cb15c80ed/01_2026_P2_EL_Curriculum_Briefing.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p2/) | 3–7: P2 learning outcomes, literacy and holistic assessment; reading/phonics plus writing/oracy are broader than app MCQs. | `a20309c68a05f3ed325056d939fee457e046cf5933b93fc64809405d247246df` |
| [ws-p3-2026-0](https://isomer-user-content.by.gov.sg/817/1121ea4b-21fb-40a6-8977-3b02891e7652/01_2026_P3_EL_Curriculum_Briefing.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p3/) | 5–6: P3 language-paper components include grammar/vocabulary cloze, editing, combining and open comprehension; this is one school’s format, not a national specification. | `527f4507589c817be627cffa8e05ab77c6a6974f2fcaf01a064085a0060949c8` |
| [tn-p2-2026-0](https://isomer-user-content.by.gov.sg/884/3a985d83-ce36-4fb1-bf7c-b43a3d3aee5b/2026_P2_EL_SOW_Outline.pdf); [school navigation](https://www.tampinesnorthpri.moe.edu.sg/for-parents/parents-portal/primary-2-2026/) | 1: P2 STELLAR unit sequence only; does not supply a full grammar-outcome list. | `3d95f44529b01085b0c32f1a11fd4729b16d38954c3db2563416255c0813bb12` |

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-4).

Additional public context: [Shuqun English curriculum](https://www.shuqunpri.moe.edu.sg/our-curriculum/english/) describes STELLAR and differentiated reading. It does not establish the PR’s every per-grade grammar subtopic.

#### Curriculum-to-bank inventory

The table enumerates the PR’s working groups, not an official MOE per-year item list. Counts do not establish approved coverage; assess the actual reading/language capability and distinguish recognition from production.

| Working topic | Current label | Questions / repair targets | Audit qualification |
| --- | --- | --- | --- |
| el.p2.nouns | Nouns and noun phrases: plurals (regular, -es, -ies, -ves, irregular), collective and uncountable nouns | 12 / 4 | in_app |
| el.p2.determiners | Determiners: a/an, this/that/these/those, some/any | 9 / 3 | in_app |
| el.p2.verbs | Verbs and verb phrases: simple present, simple past (regular/irregular), present continuous | 12 / 4 | in_app |
| el.p2.sva | Subject-verb agreement: is/are, has/have, verb -s | 9 / 3 | in_app |
| el.p2.pronouns | Pronouns: subject, object and possessive | 6 / 2 | in_app |
| el.p2.adjectives-adverbs | Adjectives (incl. -er/-est) and -ly adverbs | 9 / 3 | in_app |
| el.p2.prepositions | Prepositions of place and time | 6 / 2 | in_app |
| el.p2.conjunctions | Conjunctions: and, but, or, because, so | 6 / 2 | in_app |
| el.p2.punctuation | Punctuation: capitals, full stops, question and exclamation marks, commas in lists | 9 / 3 | in_app |
| el.p2.sentence-types | Sentence types: statement, question, command, exclamation | 3 / 1 | in_app |
| el.p2.vocabulary | Vocabulary: synonyms, antonyms, context, word groups, compound words, contractions | 18 / 6 | in_app |
| el.p2.spelling-editing | Spelling (incl. common homophones) and editing for grammar (recognition only) | 9 / 3 | in_app |
| el.p2.sentence-organisation | Word order and sequencing events | 6 / 2 | in_app |
| el.p2.writing-foundations | Connectors, sensory details and showing feelings (selection, not free writing) | 9 / 3 | in_app |
| el.p2.comprehension | Short-passage comprehension: details, sequence, vocabulary in context, feelings, simple inference | 20 / 0 | in_app; no declared repair target |
| el.p2.grammar-cloze | Grammar cloze passages | 10 / 0 | in_app; no declared repair target |
| el.p2.vocab-cloze | Vocabulary cloze passages | 5 / 0 | in_app; no declared repair target |
| el.p2.visual-text | Visual text comprehension: posters, menus, notices | 8 / 0 | in_app; no declared repair target |
| el.p3.tenses | Tenses: past continuous, future with will, irregular past, tense consistency | 12 / 4 | in_app |
| el.p3.sva | Subject-verb agreement: each/everyone/neither, there is/are, intervening phrases | 9 / 3 | in_app |
| el.p3.pronouns | Reflexive pronouns and relative pronouns who/which/whose | 6 / 2 | in_app |
| el.p3.prepositions | Prepositions of movement and fixed preposition phrases | 6 / 2 | in_app |
| el.p3.conjunctions | Conjunctions: although, when/while/before/after, if/unless | 9 / 3 | in_app |
| el.p3.adjectives-adverbs | Comparatives/superlatives (more/most, irregular), quantifiers, adverbs of frequency | 9 / 3 | in_app |
| el.p3.punctuation | Apostrophes for possession, speech marks, commas after clauses | 9 / 3 | in_app |
| el.p3.vocabulary | Vocabulary: synonyms, antonyms, context, phrasal verbs, word forms, simple idioms | 18 / 6 | in_app |
| el.p3.editing | Editing for spelling, grammar and homophones (recognition only) | 9 / 3 | in_app |
| el.p3.synthesis | Sentence combining with because/so, although, who/which, before/after, either/neither | 15 / 5 | in_app |
| el.p3.comprehension | Passage comprehension: details, reasons, inference, character traits, main message | 20 / 0 | in_app; no declared repair target |
| el.p3.grammar-cloze | Grammar cloze passages | 10 / 0 | in_app; no declared repair target |
| el.p3.comprehension-cloze | Comprehension cloze passages (no helping words in school papers; options used in app) | 10 / 0 | in_app; no declared repair target |
| el.p3.visual-text | Visual text comprehension: leaflets and notices | 8 / 0 | in_app; no declared repair target |
| el.p2.oral | Reading aloud and picture/stimulus-based conversation | 0 / 0 | external |
| el.p3.composition | Guided composition (3-picture series, at least 80-100 words) | 0 / 0 | external |
| el.p3.listening | Listening comprehension | 0 / 0 | deferred |

#### Actual paper research, 2021–2026

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-5).

| Course | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | --- | --- | --- | --- | --- | --- |
| p2 english | Retrieved | Retrieved | Retrieved | Retrieved¹ | Retrieved | Not retrieved |
| p3 english | Retrieved | Retrieved | Retrieved | Retrieved¹ | Retrieved | Not retrieved |

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-6).

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-7).

##### p2_english-2021

- Identity/date: Rosyth, Term 2 diagnostic; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/english/2021-p2-english-ha2-rosyth-pdf/); 11 PDF pages.
- Analysis page anchors: 1, 3, 6, 8. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Grammar/vocabulary MCQs, visual text and comprehension; a term diagnostic, not a complete yearly blueprint.
- SHA-256: `2748f602793301d2aefc3f4fd25dcff7caab3c10846ecadd92baf546e1f6847d`.

##### p2_english-2022

- Identity/date: Nanyang, semestral packet; catalogue 2022.
- Source: [public paper listing](https://sgexam.com/subject/english/2022-p2-english-assessment-nanyang-pdf/); 20 PDF pages.
- Analysis page anchors: 1, 5, 10–16. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Packet includes composition/listening and language sections: grammar, vocabulary, cloze, editing, word order, sentence combining and comprehension. App selection cannot assess independent production.
- SHA-256: `a8255fe0bf44c48789483b7e76df8dbf3a54a7062fdeb40467add8c965a545b9`.

##### p2_english-2023

- Identity/date: Nanyang, short language practice; catalogue 2023.
- Source: [public paper listing](https://sgexam.com/subject/english/2023-p2-english-practice-paper-1-nanyang-pdf/); 18 PDF pages.
- Analysis page anchors: 1–8, 10, 12, 14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Picture/phonics/spelling work, grammar/vocabulary and grammar cloze, sentence combining, information transfer and comprehension.
- SHA-256: `fdb828549488147e53d967112eaaa48e88d6c015a2b13ac74b23e9f29f1556a1`.

##### p2_english-2024

- Identity/date: Raffles Girls’, review practices; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/english/2024-p2-english-review-1-and-2-raffles-girls-pdf/); 16 PDF pages.
- Analysis page anchors: 1–5, 7–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Unit-linked grammar, vocabulary, punctuation and comprehension; review packet rather than a nationally prescribed paper.
- SHA-256: `c5ddf330fa8aa882f6fe72c7dd0882359e2c93acd1ed89f00e7b0b0171093e8c`.

##### p2_english-2025

- Identity/date: Henry Park, quizzes; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/english/2025-p2-english-quiz-4_5_6-henry-park-pdf/); 14 PDF pages.
- Analysis page anchors: 1, 5–8, 10–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary cloze has four blanks; two grammar clozes have three each. Comprehension numbers 26–34 span nine questions, including sequencing, retrieval and true/false. Header numbering itself is inconsistent.
- SHA-256: `ceb1c9b9395f03ad31dea02423243a1bb319a206b6188ed4f5fe4ef9798e19d6`.

##### p3_english-2021

- Identity/date: Tao Nan as catalogued, SA2; year/school identity not independently certified from cover.
- Source: [public paper listing](https://sgexam.com/subject/english/2021-p3-english-semestral-assessment-2-tao-nan-pdf/); 16 PDF pages.
- Analysis page anchors: 1, 3, 5, 7, 9–14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Grammar/vocabulary, visual text, two cloze formats, synthesis, editing and open comprehension; includes an attributed adapted third-party passage, which must not become an app passage.
- SHA-256: `94d8bcdf470ed7aa84f15002c71c36ebcfadaa94ba519fe1d39af1812743cea9`.

##### p3_english-2022

- Identity/date: ACS Junior, SA2; cover 2022.
- Source: [public paper listing](https://sgexam.com/subject/english/2022-p3-english-semestral-assessment-2-acs-junior-pdf/); 24 PDF pages.
- Analysis page anchors: 1, 4, 9–16. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Grammar, two four-blank clozes, editing, synthesis and two comprehension materials.
- SHA-256: `64c71c16fa7abcd419672d3f65d799b1bf3c0a3890f241dcf1688f00a787bae5`.

##### p3_english-2023

- Identity/date: ACS Primary, EOY; cover 2023.
- Source: [public paper listing](https://sgexam.com/subject/english/2023-p3-english-end-of-year-exam-acsp-pdf/); 22 PDF pages.
- Analysis page anchors: 1, 3, 5, 7, 11–14, 17. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Grammar eight items, vocabulary six, visual text six, four-blank clozes, editing and two comprehension materials.
- SHA-256: `740c5ae08dbb22fe3548adb073455466a14818ce52175e8f1379f5bcd0b1854b`.

##### p3_english-2024

- Identity/date: Catholic High, EOY; cover 2024.
- Source: [public paper listing](https://sgexam.com/subject/english/2024-p3-english-end-of-year-exam-catholic-high-pdf/); 22 PDF pages.
- Analysis page anchors: 1, 3–10, 15. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Grammar, vocabulary, grammar/vocabulary/comprehension cloze, editing and comprehension; packet also includes listening. The app deliberately defers listening.
- SHA-256: `61afcf6f29221853473d99d83fb4a47a9852d837c192b86d6d3385cd3a4743ee`.

##### p3_english-2025

- Identity/date: ACS Junior as catalogued, EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/english/2025-p3-english-end-of-year-exam-acs-junior-pdf/); 18 PDF pages.
- Analysis page anchors: 1–3, 7–15. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Two four-blank grammar clozes, editing and synthesis. First comprehension numbers 31–37 have seven questions with varied subparts. Fixed five-question app materials are a product choice, not the universal paper format.
- SHA-256: `b5c41de8aee835bb87af5e590c94d0705f941f207f91686c517e307ad8df2d59`.

##### Second-host 2022 bundle — english

[SmileTutor public listing](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/): 48 pages downloaded; **only PDF pp1–8 inspected/OCR processed**. The first packet is Maha Bodhi Review 1. PDF pp3–8 contain picture vocabulary, vocabulary/determiner cloze, adjective forms, word order and punctuation. These corroborate varied response demands; original app materials must not copy the packet.

SHA-256: `6788d53e25b94262ddc241964491de0ff14d214f9c8dde5db44741fd1b182579`. Full bundle content/keys were not audited.

#### Dated enrichment research, 2024–2026

| Public source | Date evidence | What was actually retrieved | Use / limit | SHA-256 |
| --- | --- | --- | --- | --- |
| [english-2024](https://www.thelearninglab.com.sg/blog/tll-shares/staying-plugged-in-our-plug-on-current-affairs) | 2024-06-28 displayed / 06-27 metadata | Public activity/article; primary age not specified | Discussion around current affairs supports reading/responding practice; not an official P2/P3 checklist or a reusable passage licence. | `c29a8073fc13e46a4f846d59fc000fd47665edf7f18f991665ac509f59d02996` |
| [english-2025](https://cpdsingapore.com/master-primary-3-english-grammar-the-ultimate-guide-to-grammar-mcq-worksheets/) | 2025-04-21 | Catalogue/article only | Publisher describes grammar MCQ practice; full workbook/questions were not retrieved. Do not count the product description as an audited question set. | `d05b756558c22c3dbbf3e3659fae54aa7a3065aa9536b2145e9d61a4890c36e8` |
| [english-2026](https://lilbutmightyenglish.com/wp-content/uploads/2026/01/LBM-Digital-brochure-workshop-March-2026.pdf) | March 2026 workshop brochure; January path | Programme outline only, PDF pp2–3 | P3/4 comprehension, synthesis, grammar, creative writing/oral workshops. This is evidence of offerings, not reviewed worksheets. | `def6b5667d65e4aa714c10a261faab4457ea679c9bb759c4bee1bd60063025a2` |

Additional actual public instruction was examined: [Lil’ but Mighty P1/P2 article](https://lilbutmightyenglish.com/blog/how-to-help-our-p1-p2-kids-find-their-footing-in-english-without-the-panic/) (displayed 01/07/2026 in the site’s month/day date style) suggests short reading responses, word work and checking. [Egghead grammar article](https://eggheadenglish.com/blog/egghead-resources/10-common-grammar-mistakes-made-by-primary-students-and-how-to-avoid-them) (19 March 2025) provides worked examples but wrongly treats an otherwise grammatical simple-past “before” construction as necessarily wrong. That prescriptive claim was rejected. A public teaching article is not automatically a reliable grammar authority. Neither source supplies an official P2/P3 grammar denominator.

#### Originality, rights and reproducibility

The app content is labelled original author draft. A bounded exact-overlap check compared every app material body and question stem against the retrieved same-subject paper OCR/text: 11 text files, 12 consecutive alphabetic words, case/punctuation normalised. **No threshold-length exact match was found.** This can miss paraphrases, OCR errors, shorter copying, images and sources outside the sample. It is not proof of originality, permission or copyright clearance. Common grammar/number templates are not by themselves evidence of copying. Retain pending rights/independent review/owner sign-off until the project’s review gates are satisfied.

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-8).

#### Disposition and next revision

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-9).

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-10).