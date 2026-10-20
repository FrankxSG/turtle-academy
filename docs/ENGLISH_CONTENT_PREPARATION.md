# English content guide

Read with the [common authoring skill](../skills/question-authoring/SKILL.md). Topics, leaves, sources and limitations are in `content/english/curriculum.json`.

## Files and status

| File | Holds | Status |
| --- | --- | --- |
| `curriculum.json` | 35 topics, 96 leaves, sources | Author working map; needs independent verification |
| `pool-001.json` v4 | 364 original questions (P2 187, P3 177), 19 materials, 91 repair sets | Author-checked; awaiting independent review and owner sign-off |
| `assets/` | 4 original SVG diagrams | — |

## Assessment formats observed

- **P2:** holistic assessment only; grammar taught through STELLAR units: nouns and noun phrases, determiners, verbs, subject-verb agreement, adjectives, adverbs, conjunctions, prepositions, punctuation, sentence types. Reading outcomes: big ideas and sequence of events.
- **P3 EOY Paper 2:** Booklet A MCQ (grammar, vocabulary, punctuation, visual text); Booklet B grammar cloze, editing (spelling and grammar), sentence combining, open comprehension. Reported counts: vocabulary 6, grammar 8, grammar cloze 8, editing 4, comprehension cloze 4, sentence combining 4; two passages of about 200–300 words; grammar cloze focuses on pronouns and subject-verb agreement.
- The app presents open school formats (cloze, editing, synthesis, comprehension) with options, so it tests recognising the correct form, not producing it.

## Past-paper findings (2021–2026, format only)

- Styles: one-blank grammar MCQ, vocabulary in context, cloze of 3–8 blanks, notices and posters for visual text, narrative and information passages.
- Material sizes vary (three, four, seven and nine questions with subparts). Five questions per app material is a product choice, not the exam pattern. X counts formal questions, not marks.
- P2 packets include picture/phonics/spelling work, information transfer, word order and sentence combining; P3 adds two four-blank clozes, editing, synthesis and two comprehension materials.
- One paper uses an adapted third-party passage; never use such passages.
- Composition, oral and listening appear in papers; the app keeps them external or deferred.
- Enrichment (2024–2026): NLB booklists and kidsREAD encourage extensive reading; publisher and workshop descriptions are not reviewed question sets.

## Content rules learnt

- **One answer only:** time conjunctions (before/after/while/when) need an explicit order or purpose in the stem; "although" items must state the contrast; there is/are items need an unambiguous noun phrase and time cue. A meaningful alternative sentence means two answers.
- Determiner items must not reject a valid "some" question; preposition items need a distinguishing stimulus.
- Homophone editing must not claim a real word (e.g. *beech*) is misspelt; it is the wrong word for the context.
- Every material question routes to a skill target: comprehension and visual-text questions to reading skills (P2: detail, reason, feelings, sequence, word meaning, find/use information; P3: detail, reason, inference, character, main message, find/apply information); each cloze blank to the grammar or vocabulary target it tests. Repair is chosen by skill, not by a guessed cause.
- Visual texts include a drawn notice, so layout and emphasis are part of the text. Use generic organisation names.
- Passages are original, with familiar Singapore settings (hawker centre, East Coast Park, wet market, Pulau Ubin) and no real people or schools.
- Writing-foundation items ask pupils to choose connectors, sensory details and "show, don't tell" sentences; free writing stays external.
- MOE gives progressing capabilities by band, not a year-specific grammar checklist; the topic list is a working inventory.

## Known gaps

Leaf map needs independent verification; reading genres are a starting sample; cloze-to-target routes need review.

## Validation

```sh
python3 scripts/validate_subject_content.py english
```
