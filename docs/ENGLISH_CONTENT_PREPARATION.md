# English content pool (P2-P3)

Independent public-source research and original findings: [research audit](content-review/ENGLISH_RESEARCH_AUDIT.md) (2026-10-16). The review disposition below records subsequent corrections; the historical audit remains evidence, not batch approval.

**Review disposition — 17 October 2026:** Independent re-review of `40aa8a4` closes the encoded-external-reference SVG finding. All six shared test methods and the subject validator pass. The prior acceptance of the robot-cloze routes, six new repair questions, cause/result route and P3 reinforcement remains valid. Pool v4 correctly identifies that revision, and the inventory now reports all 96 authored leaves. No open blocker from this correction remains for merging preparation work; this is not owner merge authorization or approved shipping content. EL3's source-complete inventory, full item QA, owner disputed-item review/random 20% sample, batch sign-off and coverage approval remain pending. Listening and full writing/oral exclusions are unchanged.

**Review proposal · 16 October 2026 · generic/public content pool**

Original P2 and P3 English questions and passages for the public (generic) version of Turtle Academy, across the eight approved exercise families (grammar, vocabulary, cloze, spelling/editing, sentence organisation, visual text, comprehension, writing foundations), with public sources cited. This document does not authorize implementation, release, merge or deployment.

## 1. What is in this pool

- `content/english/curriculum.json`: 35 topic records with scope and Pilot status, 96 leaf records (assessed ability, representation, scope, MOE page reference) and cited sources.
- `content/english/pool-001.json` (batch version 4): 364 original questions (P2 187, P3 177), 19 materials, 91 three-stage repair sets (exact → similar → generic), 91 non-repair questions with a declared repair route.
- `content/english/assets/`: 4 original SVG diagrams referenced by items or materials (no scripts, links, images or external references; titles and alt text describe the picture without giving the answer).
- `scripts/validate_subject_content.py`: structural checks (IDs, keys, 4+ distinct options, topic/source/leaf references, complete repair sets with one leaf mapping, repair routes for every non-repair question when leaves are declared, diagrams present for visual leaves, knowledge-point links and acyclic prerequisites, SVG safety, hints that do not state the answer).

Every question is newly written for this project. No question, passage or figure was copied from any past paper, school document or commercial resource. Status: **author-checked, pending independent review and owner sign-off**; not a content release.

## 2. Sources cited

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

| Topic | Grade | Scope | Pilot | Leaves | Repair sets | Questions |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Nouns and noun phrases: plurals (regular, -es, -ies, -ves, irregular), collective and uncountable nouns (`el.p2.nouns`) | P2 | in_app | open | 4 | 4 | 12 |
| Determiners: a/an, this/that/these/those, some/any (`el.p2.determiners`) | P2 | in_app | open | 3 | 3 | 9 |
| Verbs and verb phrases: simple present, simple past (regular/irregular), present continuous (`el.p2.verbs`) | P2 | in_app | open | 4 | 4 | 12 |
| Subject-verb agreement: is/are, has/have, verb -s (`el.p2.sva`) | P2 | in_app | open | 3 | 3 | 9 |
| Pronouns: subject, object and possessive (`el.p2.pronouns`) | P2 | in_app | open | 2 | 2 | 6 |
| Adjectives (incl. -er/-est) and -ly adverbs (`el.p2.adjectives-adverbs`) | P2 | in_app | open | 3 | 3 | 9 |
| Prepositions of place and time (`el.p2.prepositions`) | P2 | in_app | open | 2 | 2 | 6 |
| Conjunctions: and, but, or, because, so (`el.p2.conjunctions`) | P2 | in_app | open | 2 | 2 | 6 |
| Punctuation: capitals, full stops, question and exclamation marks, commas in lists (`el.p2.punctuation`) | P2 | in_app | open | 3 | 3 | 9 |
| Sentence types: statement, question, command, exclamation (`el.p2.sentence-types`) | P2 | in_app | open | 1 | 1 | 3 |
| Vocabulary: synonyms, antonyms, context, word groups, compound words, contractions (`el.p2.vocabulary`) | P2 | in_app | open | 6 | 6 | 18 |
| Spelling (incl. common homophones) and editing for grammar (recognition only) (`el.p2.spelling-editing`) | P2 | in_app | open | 4 | 3 | 9 |
| Word order and sequencing events (`el.p2.sentence-organisation`) | P2 | in_app | open | 2 | 2 | 6 |
| Connectors, sensory details and showing feelings (selection, not free writing) (`el.p2.writing-foundations`) | P2 | in_app | open | 3 | 3 | 9 |
| Short-passage comprehension: details, sequence, vocabulary in context, feelings, simple inference (`el.p2.comprehension`) | P2 | in_app | open | 5 | 5 | 35 |
| Grammar cloze passages (`el.p2.grammar-cloze`) | P2 | in_app | open | 0 | 0 | 10 |
| Vocabulary cloze passages (`el.p2.vocab-cloze`) | P2 | in_app | open | 0 | 0 | 5 |
| Visual text comprehension: posters, menus, notices (`el.p2.visual-text`) | P2 | in_app | open | 2 | 2 | 14 |
| Tenses: past continuous, future with will, irregular past, tense consistency (`el.p3.tenses`) | P3 | in_app | open | 4 | 4 | 12 |
| Subject-verb agreement: each/everyone/neither, there is/are, intervening phrases (`el.p3.sva`) | P3 | in_app | open | 3 | 3 | 9 |
| Reflexive pronouns and relative pronouns who/which/whose (`el.p3.pronouns`) | P3 | in_app | open | 2 | 2 | 6 |
| Prepositions of movement and fixed preposition phrases (`el.p3.prepositions`) | P3 | in_app | open | 2 | 2 | 6 |
| Conjunctions: although, when/while/before/after, if/unless (`el.p3.conjunctions`) | P3 | in_app | open | 3 | 3 | 9 |
| Comparatives/superlatives (more/most, irregular), quantifiers, adverbs of frequency (`el.p3.adjectives-adverbs`) | P3 | in_app | open | 3 | 3 | 9 |
| Apostrophes for possession, speech marks, commas after clauses (`el.p3.punctuation`) | P3 | in_app | open | 3 | 3 | 9 |
| Vocabulary: synonyms, antonyms, context, phrasal verbs, word forms, simple idioms (`el.p3.vocabulary`) | P3 | in_app | open | 6 | 6 | 18 |
| Editing for spelling, grammar and homophones (recognition only) (`el.p3.editing`) | P3 | in_app | open | 3 | 3 | 9 |
| Sentence combining with because/so, although, who/which, before/after, either/neither (`el.p3.synthesis`) | P3 | in_app | open | 6 | 5 | 15 |
| Passage comprehension: details, reasons, inference, character traits, main message (`el.p3.comprehension`) | P3 | in_app | open | 5 | 5 | 35 |
| Grammar cloze passages (`el.p3.grammar-cloze`) | P3 | in_app | open | 0 | 0 | 10 |
| Comprehension cloze passages (no helping words in school papers; options used in app) (`el.p3.comprehension-cloze`) | P3 | in_app | open | 0 | 0 | 10 |
| Visual text comprehension: leaflets and notices (`el.p3.visual-text`) | P3 | in_app | open | 2 | 2 | 14 |
| Reading aloud and picture/stimulus-based conversation (`el.p2.oral`) | P2 | external | open | 1 | 0 | 0 |
| Guided composition (3-picture series, at least 80-100 words) (`el.p3.composition`) | P3 | external | open | 1 | 0 | 0 |
| Listening comprehension (`el.p3.listening`) | P3 | deferred | open | 1 | 0 | 0 |

## Correction revision — 16 October 2026

Batch version 2 corrects 29 disputed or related items. The market passage answer now states that the mother gave the auntie rambutans. Preposition questions gain a distinguishing stimulus or lose defensible alternative options; determiner questions no longer reject a valid `some` question. Present-tense prompts explicitly name the required tense, conjunction/synthesis prompts state the intended relation, valid alternative `although` sentences are replaced, and before/after order is explicit. The homophone-editing item now distinguishes a valid tree word from the intended seaside word; its task does not claim that `beech` is intrinsically misspelt. A hint that directly named water is also replaced. Revised item versions are incremented and IDs remain listed for independent re-review. Counts and material grouping are unchanged. Skill-level coverage/repair mappings, verified source pages, dated paper/enrichment analysis and owner sign-off remain open.

These are proposed corrections, not independent approval. Existing task/history must retain earlier pinned versions; this authoring revision does not implement evidence migration or retroactive regrading.

## Audit-response revision — 16 October 2026 (batch version 3)

Responds to [ENGLISH_RESEARCH_AUDIT.md](content-review/ENGLISH_RESEARCH_AUDIT.md) EL1–EL4. Author revision only: every revised or new item is pending independent re-review and owner sign-off.

| Finding | Change in this batch | Still open |
| --- | --- | --- |
| **EL1** multiple-answer stems | `el-p3-when-while-before.q1`–`.q3` now state the purpose or timeline that fixes the answer: germs on food → *before*; "still in the shower" → *while*; "did not miss the ending" → *after*. `el-p3-sva-there.q1` uses an unambiguous plural noun phrase and a present-time cue ("two umbrellas … right now"), and *were* is no longer an option. `el-p3-although.q1`–`.q3` now state the contrast in the sentence ("did not stop", "limped across", "still helped"). | Independent review |
| **EL2** repair routes for passages | 14 new reading and visual-text skill targets (P2: find detail, find reason, feelings, sequence, word meaning, find information, use information; P3: find detail, find reason, inference, character, main message, find information, apply information), each with 3 new original mini-passages (42 items). Every one of the 91 material questions now has a `repair_target_id`. Comprehension and visual-text questions route to a skill target. Each cloze blank routes to the grammar or vocabulary target it tests (for example, the *went* blank routes to simple past irregular). | Repair choice is by skill, not by an inferred error cause. Reviewers should check the cloze-to-target routes. |
| **EL3** strength of coverage claims | `curriculum.json` limitations and leaves now state that the per-year list is a working inventory, not an MOE checklist. There is one leaf per repair target (MOE pp22/26/28/30, lower-primary band). Spelling and sentence production are `partial`, oral and composition are `external`, and listening is `deferred`. The four visual texts now include a drawn notice, so layout and emphasis are part of the text. | The leaf map is an author map and needs independent verification. The reading genres are still a starting sample. |
| **EL4** material aggregation | No fixed exam pattern is claimed. Aggregation rules: each formal question counts once toward X. Cloze blank *(n)* is question *n* in `question_ids` (the validator checks that each marker appears exactly once). Each question routes to its own repair target. Feedback is delayed until the whole material is answered, as in the Pilot design. | The engine compile step still has to implement these rules. |

Also changed: the P3 night-zoo leaflet and one new notice now use generic names, so no item appears to come from a real organisation.

## Validation

```sh
python3 scripts/validate_subject_content.py english
python3 scripts/privacy_guard.py
```

Passing validation proves structure only. Remaining before release: independent review of every item, random 20% sample of agreed items, owner batch sign-off, verification of topic boundaries against the official MOE syllabus PDF, and the existing Pilot coverage, data-protection and device gates. No learner data is used or implied by any item.

## Re-review corrections — 17 October 2026 (batch version 4)

Responds to the independent re-review of `710c0a1`, which closed the robot-cloze route finding and accepted the six new questions, the volunteer "so" route and and/but/or as P3 reinforcement.
- **Pool version 4.** The previous round added the `el.p3.object-pronoun` and `el.p3.and-but-or` repair sets and rerouted two blanks, but did not raise the pool version. Item versions were already incremented. The inventory line above now shows the current counts.
- **Shared SVG guard.** Attribute values are now checked after XML decoding. Encoded `url(` and `https`, protocol-relative values, `data:` and CSS escapes are rejected, while same-file `url(#id)` stays allowed. The re-review's encoded probes are failing tests.

Still open: the source-complete inventory (deferred to the next round), item QA, the 20% sample and owner sign-off.
