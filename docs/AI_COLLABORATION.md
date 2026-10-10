# Turtle Academy — Claude and ChatGPT Collaboration

Established: 2026-10-10 by the project owner's request to use GitHub as the shared source of truth.
Applies equally to Claude and ChatGPT. Neither assistant's chat history is inherently authoritative over the other's.

## Operating rules at a glance

1. **GitHub is the only record.** Start every task by reading `main`, open PRs and the task's Issue. If the chat and GitHub disagree, GitHub wins until the owner says otherwise.
2. **One task, one branch, one owner.** Branches are named `claude/<short-topic>` or `chatgpt/<short-topic>`, and the prefix shows who owns the work. Only the owner pushes to that branch. The other assistant reviews or takes a different task.
3. **Small PRs against `main`.** One focused change per PR. Open it as a draft until its checks pass. Rebase onto the latest `main` before marking it ready.
4. **Avoid collisions.** Say in the Issue which files or folders the task will touch. Only one open PR at a time may change `package.json`, `package-lock.json`, `.github/` or `scripts/`. Decision documents change in their own PR, never mixed with code.
5. **The owner merges.** Assistants never merge, approve their own work or deploy. The other assistant reviews the diff and leaves a comment, not an approval. The repository owner approves and squash-merges. Changes under `.github/`, `scripts/` and the decision documents always need owner review (see `.github/CODEOWNERS`).
6. **Keep actions to a minimum.** No Issue for a tiny documentation fix that its PR already explains. No comment that only says "done". Batch related edits into one push. Run the full browser tests only when code, dependencies or build settings change, not for documentation changes. The automatic `Privacy guard` check is cheap and always runs.
7. **Hand over in writing.** When a task changes hands, use the handoff format below in the Issue or PR, so the next assistant needs no chat history.
8. **Public repository.** Everything written here is public and permanent. Never include learner, family, school, account or infrastructure details, or secrets, in code, commits, PRs, Issues or comments.

## Shared records

| Record | Use |
| --- | --- |
| `docs/TECHNICAL_DESIGN_DECISIONS.md` | Confirmed architecture, privacy and technical constraints |
| `docs/FEATURE_SCOPE.md` | Full long-term feature and curriculum scope; not a release checklist |
| `docs/PILOT_V0_1_SCOPE.md` | The only committed delivery slice (Pilot v0.1) |
| `docs/FOUNDATION_SETUP.md` | Infrastructure/code validation evidence, with date, branch and links |
| `docs/TECHNICAL_HANDOFF.md` | Entry summary for new sessions |
| GitHub Issues | Task scope, acceptance criteria, current owner, dependencies and blockers |
| GitHub PRs | Concrete proposed changes, review, tests and integration history |
| `AGENTS.md` and `CLAUDE.md` | Small entrypoints to this common protocol; do not duplicate separate rule sets |

Chat decisions that change architecture or scope must be recorded in the appropriate document and reviewable change. A new explicit owner instruction supersedes older records; identify and reconcile it. Keep a proposal labelled as a proposal until confirmed. Tests cannot turn a proposed product decision into a confirmed requirement.

Confirmed requirements in the two design documents apply unless the owner changes them.

## Task workflow

1. Read the current repository instructions, design documents, handoff and setup register. Verify default branch/head, relevant open PRs and Issues. State which branch and commit you are using. Never treat an unmerged PR as code already in `main`.
2. Use an existing scoped Issue or create one when implementation needs coordination. Record goal, acceptance criteria, dependencies, current implementing assistant and the planned reviewer. Do not create duplicate tracking tickets for a small documentation change already tracked by its PR.
3. One assistant owns a task branch at a time. The other reviews or works on an independent task/branch. Use separate worktrees or checkouts when available. Do not both push to the same branch without an explicit handoff.
4. Use a task branch and a focused PR against the agreed base. If work depends on an unmerged PR, declare that dependency; do not copy its changes into a second unrelated PR or assume it is merged. Never force-push over another assistant's work.
5. Implement the task, run relevant checks, review privacy exposure and update affected evidence/docs in the same change. Pin new dependencies and commit lockfiles. Do not run redundant matrices/builds just because another assistant takes over.
6. Have the other assistant review the actual diff, relevant requirements and test evidence. Review is independent of implementation; do not imply Claude reviewed code when only ChatGPT did. Do not submit a formal self-approval through a shared GitHub identity.
7. Integrate through PRs following repository protections and the owner's task authorization. An onboarding, review or documentation request alone is not authorization to merge unrelated code, deploy, publish the repository, spend money or introduce real learner data.
8. After integration, update task status and implementation evidence with the merged commit. Before the next task, refresh from GitHub again.

Roles are per task, not a permanent “Claude codes / ChatGPT plans” split. Either assistant can implement or review. The owner decides product changes, priorities, releases/publication and spending. Respect the human approval requirement for deployment in the confirmed architecture document.

## Handoff format

Leave this information in the relevant Issue or PR when transferring work:

```text
Task and acceptance criteria:
Implementing assistant / next reviewer:
Repository, branch, base SHA and current head SHA:
Commits / PR link:
Changes completed:
Checks run, tested SHA and result links:
Unverified behavior:
Remaining steps / blockers / decisions required:
Files or branch currently owned by this task:
```

Do not include secrets, learner information, worksheet extracts, account or infrastructure identifiers, or private production logs: Issues and PRs here are public. A chat-only “done” does not establish a shared project state. Technical blockers must be recorded as blockers, not guessed around.

## Evidence and disagreements

- Distinguish confirmed requirements, implementation, successful tests and unresolved validation. Attach relevant commits and run links, not only a conclusion.
- Refresh stale GitHub state before correcting the other assistant. Code may have changed since either chat.
- Treat historical prototype names, suggested module layouts and assistant-generated options as context, not current decisions.
- Discuss architectural alternatives in a scoped Issue or PR. Do not reopen a confirmed choice without a material technical, educational, privacy or security reason.
- If a change truly needs a new owner decision, state the concrete conflict and proposed resolution. Neither assistant invents approval for the other.
- Verify current vendor documentation when giving settings, quotas or authentication instructions. Guide through observed app flows; do not invent menus, require URL editing or ask for screenshots that are unnecessary. If account-specific state cannot be read, say what remains unverified.

## Non-negotiable project boundaries

- No runtime AI. Development use of Claude/ChatGPT does not authorize AI inside the child's app or external AI processing of learner records.
- Synthetic development data only; no real learner files anywhere in the checkout, including ignored folders, screenshots or artifacts.
- Separate generic content from private learner instances; enforce authenticated ownership, RLS and private storage for registered records.
- Guest remains local-only and cannot silently acquire registered-only capabilities.
- Preserve offline data and distinguish submissions/story from verified mastery. Specify idempotency and reconciliation before implementing registered sync.
- Keep unrelated applications, accounts/projects and environments isolated. Inspect actual target identities before service writes.
- The repository is public: treat every commit, Issue, PR comment and CI log as published. No paid infrastructure by default. Deployment is a distinct approved action.
- The full feature scope is not the build list; `docs/PILOT_V0_1_SCOPE.md` defines the committed slice.

## Access setup

Anyone can read this repository; pushing branches and opening PRs requires repository-scoped write access granted by the owner. Verify access by reading the current main SHA and the two planning documents. No tokens/passwords in source files, Issues, PRs or chat handoffs. Supabase/Vercel access is separate, must be verified independently, and its account and project details stay out of this repository.

If write access is unavailable, work from an explicitly identified snapshot and report its commit. Do not claim current GitHub inspection or push unverified changes.
