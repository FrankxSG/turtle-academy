---
name: engineering-verification
description: Implement and review Turtle Academy code, bug fixes and tests using reproducible failures and precise verification evidence. Also use the preservation check for documentation cleanup and the claim check for project-status or testing-availability statements.
---

# Engineering verification

Follow the existing [shared workflow](../../AGENTS.md). Keep evidence and handoffs in the current task/PR. Select checks for the changed behavior and material risks; reuse valid unchanged-code evidence. Expand verification when changes, failures or unresolved concerns justify it, not to repeat a ritual. Do not add approval rounds, permanent reports or tools merely to follow this skill.

## Implement and recheck

1. Read current main, the task/PR head, canonical requirements and affected code. Identify the intended behavior and what must remain true. Trace callers and dependent UI, storage and content rather than reading only changed lines.
2. Reproduce a bug before fixing it; trace the cause across component boundaries. If reproduction is unavailable, label the hypothesis and verification gap instead of claiming a confirmed defect or fix. For new behavior, derive tests from requirements rather than implementation details.
3. For meaningful behavior fixes, observe the regression fail on the broken behavior and pass after correction. Use an isolated checkout or reversible local edit; preserve other work. A failure must expose the intended bug, not a setup error. A suite that runs only in CI is not a reason to skip this: push the regression before the fix and record that commit's failing run. Only if neither is possible, disclose that the test's ability to detect the bug is unverified. Avoid tests for trivial wording or mechanical edits.
4. Challenge the correction in a separate self-review pass: what assumption would make it wrong, which dependent behavior could break, and would the test pass if the fix were removed? Recheck related hints/explanations after option changes and active UI messages after persistence changes.
5. For async or persistence changes, select the relevant boundaries before coding: late/stale responses, triggers that arrive while a run is in flight or finishing, sign-out/disposal, failed writes, crash/restart, duplicate retries and partial completion. Control promises and wait for observable state rather than arbitrary sleeps. Assert actual persisted/replayed results and user-visible state. Exercise real IndexedDB or integration paths when mocks cannot establish the behavior. Use generated invariant tests selectively for replay, serialization or deduplication; do not infer all merges commute.
6. Search affected code/content for the same defect pattern and fix in-scope variants. Run affected checks, inspect results and hand reviewer-authored fixes to another reviewer under AGENTS.md. Self-review is not independent review.

## Match claims to evidence

- Before reporting results, confirm the repository, tested commit and local changes, command, relevant runtime/build mode and result. Distinguish local execution from CI and reused evidence. Never transfer a stacked-branch pass to a standalone branch. Recheck current head before a readiness verdict; describe any older evidence and why it still applies.
- Verify owner choices against original explicit evidence. If evidence is unavailable, say so; do not promote a default or agent summary into a decision.
- Separate requirements, implementation, passing tests, deployment and accessible user workflows. Before sharing a testing URL, establish that it serves the intended app and verify its relevant entry flow with synthetic data; disclose blocked access or missing setup. Chromium or screenshots do not establish physical iPad behavior.
- Report what was observed and the remaining limits. Readiness for a scoped implementation merge does not imply deployment, device acceptance or real-record readiness.

## Preserve meaning during cleanup

For each removed substantive requirement, source interpretation, authoring lesson, unresolved finding or approval, identify its retained location and compare the meaning. Preserve historical versions when approval depends on them. Keep reusable knowledge discoverable from current guides; an archive alone is insufficient. Check counters/examples as well as headings and links. Measure explicit output constraints, such as instruction character limits.

## Known counterexamples

- [PR24](https://github.com/FrankxSG/turtle-academy/pull/24#issuecomment-6251856546): stacked-checkout results did not prove the standalone branch passed.
- [PR32](https://github.com/FrankxSG/turtle-academy/pull/32#issuecomment-6368293229): recovery fixes introduced a stale-refresh race and a start delay.
- [PR32](https://github.com/FrankxSG/turtle-academy/pull/32#issuecomment-6377566913): a write saved as a sync run finished stayed queued, and a regression switched state too early to catch its bug.
- [PR9](https://github.com/FrankxSG/turtle-academy/pull/9#issuecomment-6194194000): timer tests depended on animation/effect timing.
- [PR31](https://github.com/FrankxSG/turtle-academy/pull/31#issuecomment-6354330531): archived text did not keep audit results and open notes discoverable in current guides.

Methods adapted to this project: obra/superpowers [systematic-debugging](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md), [test-driven-development](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md), [verification-before-completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md) and [requesting-code-review](https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/SKILL.md); Trail of Bits [differential-review](https://github.com/trailofbits/skills/blob/main/plugins/differential-review/skills/differential-review/SKILL.md); official [Claude Code practices](https://code.claude.com/docs/en/best-practices) and [Codex practices](https://learn.chatgpt.com/guides/best-practices). These are references, not additional mandatory workflows. No upstream scripts, hooks or framework are installed.
