# AGENTS.md

Turtle Academy: an offline-capable learning PWA for one primary-school child. React, Vite, TypeScript, Dexie (IndexedDB), Supabase.

## Layout

- `src/engine/` learning engine (tasks, repair stages, review dates)
- `src/ui/`, `src/hub/`, `src/parent/` screens
- `src/catalogue/`, `content/<subject>/` question content (JSON)
- `src/mistakes/` private mistake pack import
- `supabase/` database migrations and tests
- `src/trials/` separate demo features, not in the app build

## Commands

```sh
npm run typecheck
npm run test:engine
npm run test:ui
npm run build
npm run test:e2e
python3 scripts/privacy_guard.py
python3 scripts/validate_subject_content.py <subject>
python3 scripts/validate_chinese_content.py
```

## Rules

- This repo is public: no real learner data (worksheets, answers, mistakes, name, school) and no secrets. Real material lives in the private `turtle-academy-resources` repo.
- No AI inside the app.
- Start from current main and check open PRs. One branch and PR per task (`claude/…` or `chatgpt/…`); continue an existing PR rather than opening a competing one. Agents working in parallel take separate files.
- Before opening or updating a PR, the relevant tests pass. The owner merges, or tells you to merge a named PR.
- Reviews: commit the fixes in the same PR; leave open only points that need the owner's decision. No review documents in the repo, and no new docs or policy text unless the owner asks.
- Content work: follow `skills/question-authoring/SKILL.md`, then the subject skill (e.g. `skills/chinese-question-authoring/SKILL.md`).
- Product behaviour: `docs/PILOT_FUNCTIONAL_DESIGN.md`.
