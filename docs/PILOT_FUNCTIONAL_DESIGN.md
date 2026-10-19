# Pilot v0.1 — Functional Design

Goal: a usable daily-practice tool for one family. One parent account, one child profile (nickname only). Each subject releases separately; full P2 coverage is the aim.

## 1. Scope

| Subject | In the Pilot | Not in the Pilot |
| --- | --- | --- |
| Chinese / Higher Chinese | P2 mistakes and practice; P3 general practice | Handwriting, writing, oral, listening |
| Mathematics | All P2 knowledge points, objective answers | P3 (locked until a Maths teaching flow is built), typed answers |
| English | P2 mistakes and practice; P3 general practice; 8 exercise families (grammar, vocabulary, cloze, spelling/editing, sentence order, visual text, comprehension, writing foundations) | Free writing, oral, listening, typed spelling |
| Science | 7 P3 topics: diversity of living and non-living things; classification of living things; diversity of materials; life cycles of plants; life cycles of animals; properties of magnets; making and using magnets | P2 Science, scored free explanations |

Delivery order: Chinese, Science, Mathematics, English. Release guideline: 75% of a subject's P2 outcomes (Science: of its first two topics); the owner can override.

Also out of the Pilot: runtime AI or OCR, in-app worksheet scans, Guest mode, sign-up, multiple children, weekly timetable, tracing, PDF generation.

## 2. Daily use

- Each subject has a parent setting **X** = 6–19 questions (default 10; Chinese up to 20).
- On first entry each day the app suggests a subject with reviews due; the child may pick another. When every available subject is done, the island opens for exploration.
- Pause and resume keep everything. Finishing yesterday's unfinished task counts for today. No missed-day debt, streaks or catch-up tasks.
- **Rest day**: the parent can mark today as rest; nothing is credited.
- Active time per subject counts only while in use (stops after 2 minutes idle).
- UI and story language: Chinese or English. Chinese content stays in Chinese; other subjects in English.
- **Parent PIN** (4–6 digits) protects settings, imports and records, offline too. Reset needs the account password.

## 3. Chinese and English tasks

- A task has at least ceil(X/5) whole passages (X 6–10: 2; 11–15: 3; 16–20: 4) and at least X questions.
- Short review/repair questions for targets the passages don't cover come first, up to about half the task. Due reviews before repair; each repair target gets one slot before any gets a second.
- All first answers in a passage are given before feedback and correction.
- A target tested in a passage advances only if all its first answers in the task are correct, and its next stage waits for the next task.

## 4. Mistakes, repair and review

- Every mistake becomes a **target**: Chinese character/word, language point or reading skill; Science knowledge point; Maths knowledge point and method; English vocabulary, grammar point or reading skill.
- Repair has three stages: the original error → a similar question → a new context. A stage clears with one first-try correct answer on a 4+ option, matching or ordering question, or two on true/false or 2–3 option questions. A wrong first answer resets the low-option count.
- Help after a wrong answer: hint, one retry, then the answer and a short explanation. Hint-assisted answers never advance a stage.
- After a wrong answer, more practice on that target starts the next day. The final stage is always on a later day than stage 2. At most two stages clear per target per day.
- After the three stages: delayed reviews at **1 → 3 → 7 → 14 → 30 days, then every 30 days**. A wrong review restarts at 1 day.
- Order of work: due reviews, then repair, then general practice.
- Wrong first answers in general practice join the mistake bank automatically. A repeat counts only on a different day or from a new import.
- Prefer unseen questions; reuse older ones when needed, without calling them new evidence.

## 5. Science

- Each small knowledge point: guided look and short teaching, then two independent tests in different contexts. Both right: it enters review. Either wrong: repair.
- Teaching does not count towards X. Later chapters unlock in syllabus order as content is reviewed.
- If nothing eligible is left, the task ends early and still counts as done.

## 6. Answers and exercise types

All answers are objective: choice, matching, word bank or ordering, with click alternatives to drag. No keyboard answers. Maths uses number options, not typed numbers.

## 7. Adventure

Small 2D island, movable avatar, one companion, a few interactions and one shared story across all subjects. Story checkpoints at halfway and completion of each task. Rewards never depend on correctness. No scores, leaderboards or paid items.

## 8. Parent

- **Import mistakes**: the parent uses a private Claude or ChatGPT chat to extract mistakes from worksheets (the AI removes names and school), checks them, then pastes the result into the app and confirms once. Worksheets themselves are never stored in the app.
- Parent view: per-subject time, answers, retries, stages, due dates and the reason for any short task.
- The parent can fix or invalidate an import or record; progress is recalculated.
- The child can flag a bad question and gets a replacement; the parent decides to restore or disable it.

## 9. Offline and sync

- After the first online sign-in, practice works offline.
- **Sync (owner decision, 19 Oct 2026):** learning records and the private mistake pack sync to every signed-in device. Answers are add-only; stages and dates are recalculated; settings keep the latest edit. The wrong-answer text, PIN and worksheets never leave the device. Not built yet.
- Content updates ship with app updates and are cached for offline use.
