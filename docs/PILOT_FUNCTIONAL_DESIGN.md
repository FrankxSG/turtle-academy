# Pilot: daily learning for one family

Chinese releases first, then Science, Mathematics and English; each releases separately. Architecture and privacy: [technical decisions](TECHNICAL_DESIGN_DECISIONS.md). Later capabilities: [full scope](FEATURE_SCOPE.md).

## 1. Scope

| Subject | Pilot |
| --- | --- |
| Chinese / Higher Chinese | P2 mistakes and general practice; P3 general practice from first release; P3 mistake imports later |
| Mathematics | P2 objective practice; P3 locked until a later teaching flow |
| English | P2 mistakes and general practice; P3 general practice from first release, imports later; grammar, vocabulary, cloze, spelling/editing, sentence order, visual text, comprehension, writing foundations |
| Science | P3: diversity of living and non-living things, classification of living things, materials, plant and animal life cycles, properties of magnets, making and using magnets |

One parent and one nickname-only child; no Guest, sign-up or multi-child. Not in the Pilot: runtime AI/OCR, worksheet scans in the app, typed answers, automatic handwriting/writing/oral assessment, listening, tracing, PDF generation, weekly timetable.

Release guideline: 75% of P2 in-scope outcomes per subject (Science: its first two topics; later topics unlock as reviewed). The owner may override.

## 2. Daily use

- Per-subject X: 6–19 questions, default 10; Chinese up to 20. A changed X applies to new tasks. X counts first-try questions, not teaching, retries or correction.
- The app suggests a subject with due work; the child may choose another. Exploration opens when all available subjects are done. Extra practice earns no extra daily or story credit.
- Pause/resume keeps everything. Finishing yesterday's task counts for today. No missed-day debt or streaks.
- Rest day opens exploration and credits nothing. Active time includes teaching and stops on pause, background or two minutes idle.
- UI/story language Chinese or English; Chinese content stays Chinese, other subjects English. Answers are choice, matching, word bank or ordering, with tap alternatives to drag.
- Parent PIN: 4–6 digits, device-only, with growing back-off after wrong tries; reset needs the account password online. Restore and deletion need the password.
- Timezone changes never create extra days or bring reviews forward.

## 3. Tasks and feedback

- Language tasks have at least ceil(X/5) whole passages and at least X questions; rotate reading, visual text and cloze. Never cut a passage to hit X.
- Short review/repair questions for targets the passages don't cover come first, up to max(X − passage questions, ceil(X/2)). Due reviews before repair; each repair target gets one slot before any gets a second.
- All first answers in a passage come before feedback. A target tested in a passage advances only if all its first answers in the task are correct, once, and its next stage waits for another task.
- Wrong first answer: hint, one retry, then correction and explanation. Assisted answers never advance. Flagged questions are replaced; if none remain, the task ends with a visible reason.

## 4. Repair and review

- A target is the actual character/word/skill/concept or Maths relationship/method; unknown causes stay unknown. Targets without content stay private as `pending_content`.
- Stages: exact error → similar → new context. A stage clears with one first-try correct answer on a 4+ option, matching or ordering question, or two on low-option questions; a wrong first answer resets the low-option count.
- At most two stage clears per target per day; the final stage is always on a later day than stage 2. After a failure, practice on that target resumes the day after the task finishes. Imports start the day after import.
- After repair: delayed reviews at 1 → 3 → 7 → 14 → 30 days, then every 30. A wrong review restarts at 1 day.
- Priority: due review → repair → general practice. Wrong first answers in general practice join the bank from the next task. A repeat counts only on a different day or from a new import.
- Older questions may be reused when needed, but repeat success is not counted as transfer to a new context.

## 5. Science

- Each knowledge point: guided look and short teaching, then two tests in different contexts. Both right: review. Either wrong: repair. After help is shown, a same-day second test does not count.
- Two question slots are kept for new learning when reviews are also due.
- A failed prerequisite blocks only the topics that depend on it, until repaired.
- Filler questions skip anything shown in the last 7 days. If nothing is eligible, the task ends early and still counts.

## 6. Adventure and parent view

- Small 2D island, avatar, one companion, one shared story. Story checkpoints at halfway and completion, shown once even across reloads. Rewards never depend on correctness; no scores, leaderboards or paid items.
- Parent view: time per subject, stages, due dates, answers, retries and help, and reasons for short tasks.
- The parent can fix or invalidate records; progress is recalculated without removing story or past daily credit. A flagged question can be restored or disabled for this child only.

## 7. Importing mistakes

- The parent uses a private Claude or ChatGPT chat to extract mistakes from worksheets; the AI removes identifying details. The parent checks the result, previews it in the app and confirms once.
- Imports carry no names, school, source text or images. Wrong-answer text stays on the device. Re-importing the same source adds nothing.
- Owner QA for each batch of new questions: check every disputed item and a random 20% of the rest, then sign off.

## 8. Offline and sync

- After the first online sign-in, practice works offline with no time limit. Sign-in is needed only to sync.
- **Live sync (owner decision, 19 Oct 2026; not built):** learning records and the private mistake pack sync to every signed-in device. Answers are add-only; stages and dates are recalculated; completions and story only move forward; settings keep the latest edit. Wrong-answer text, PIN and worksheets never leave the device. Server snapshots keep the newest ten; a restore brings back settings and the pack and never removes answers.
- Content updates ship with app updates and stay cached offline; active tasks keep the content version they started with.
