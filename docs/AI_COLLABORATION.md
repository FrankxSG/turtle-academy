# Turtle Academy — Claude and ChatGPT Collaboration

Established: 2026-10-10 by the project owner's request to use GitHub as the shared source of truth.
Applies equally to Claude and ChatGPT. Neither assistant's chat history is inherently authoritative over the other's.

## Operating rules at a glance

1. **GitHub is the shared source of truth.** Approved default-branch decisions define requirements; code and checks define implementation; Issues and PRs define active work. A later explicit owner instruction supersedes an older record: update the affected document before other work relies on it.
2. **One task, one branch, one implementing assistant.** Use `claude/<short-topic>` or `chatgpt/<short-topic>`. The other assistant reviews or implements an independent feature in a separate checkout. Neither assistant has a permanent planning or coding role.
3. **Coordinate before editing.** Record task ownership, acceptance criteria, affected paths and dependencies in one Issue for substantive work, or the PR for a small change. Check current open work before claiming a task.
4. **Use focused PRs against main.** Keep work in draft while incomplete. Update from main when shared changes, conflicts, repository rules or validation require it; do not mechanically rebase every PR or force-push over someone else's work.
5. **Review and merge are explicit.** The repository owner approves and merges by default. An assistant may execute a merge only with explicit owner authorization for that PR or an explicitly recorded standing policy, after the review and checks below. This protocol grants no standing merge, publication, deployment or spending permission.
6. **Run checks proportional to the change.** Reuse results for unchanged tested code; rerun affected checks after changes or integration risks. Documentation-only work needs privacy and document checks, not the full browser suite. An automatic privacy check supplements human review.
7. **Minimize administration.** One tracking record, one focused PR and one concise validation summary. Batch related edits; avoid redundant reads, comments, test matrices, builds and status polling.
8. **Apply public-data rules now.** Whether private or public, every committed file, branch, PR, Issue and log must be safe to publish. Keep real learner information, personal documents, infrastructure details and credentials outside the repository.

## Parallel feature work and shared files

Claude and ChatGPT can implement separate features concurrently. Each records its intended file ownership before editing and uses a separate branch/check-out. Work on separate lesson content can proceed in parallel when it uses an agreed shared component/content contract.

- Overlapping files or interfaces require a written handoff or an agreed sequence. Reserve the actual shared paths, not whole folders unnecessarily.
- Keep one active writer for dependency manifests/lockfiles and a shared configuration file. The other assistant requests its needed change in the same tracking record instead of making a competing edit.
- Agree the minimum shared contract before dependent feature work. A common component, schema or API change has one owner; dependent PRs declare that dependency and integrate after it.
- Do not mix unrelated architecture or feature-scope decisions into implementation. Update decision documents only for explicitly confirmed changes, with a focused review.
- A handoff identifies the current branch/head and transfers ownership. Do not delete another assistant's branch, reset its checkout or overwrite uncommitted work.

## Integration and merge checklist

Merge independent ready PRs one at a time. After each merge, the remaining implementer checks the new main for relevant interface, dependency or overlapping-file changes.

1. Confirm the agreed task and acceptance criteria are met; review the diff and publication/privacy exposure.
2. The other assistant reviews the actual current PR head and records the reviewed SHA, findings and any limitations. If unavailable, the owner can supply review; do not invent cross-assistant review.
3. Validate at the relevant SHA and link existing check evidence. Resolve conflicts deliberately, then rerun checks affected by the resolution or changed shared code. A passing earlier SHA does not validate changed code.
4. Refresh PR head, main, review status and required checks immediately before an authorized merge. Stop if unexpected work or unresolved findings appeared.
5. Squash-merge by default, subject to repository settings and owner authorization. Never bypass failing required checks. CODEOWNERS review requirements apply when enforced; the file alone does not enforce them.
6. After merge, update the existing task record once with the resulting commit and remaining limitations. Close completed tasks; delete a merged task branch only when permitted. Do not perform a second full build solely because another assistant takes over.
7. Deployment, repository publication, real learner data and spending remain separate controlled actions.

Review comments can record independent review when both tools use the same GitHub identity; they do not bypass GitHub restrictions on formal self-approval. A comment is not a substitute for a required approval from an eligible reviewer.

## Minimum necessary actions

| Change | Necessary validation | Avoid |
| --- | --- | --- |
| Documentation/protocol | Privacy scan, relevant links and consistency, diff review | Dependency install, app build or browser suite solely for text changes |
| Lesson/content data | Content/schema and answer-key checks, affected lesson smoke test, privacy/licensing review | Full browser matrix for an isolated content correction |
| UI or learning logic | Type check and affected behavior tests; build when bundling or offline assets change | Repeating an unchanged suite after every small edit |
| Shared engine, persistence, dependencies or build | Relevant regression/build/offline checks; broader coverage when the risk warrants it | Unrelated matrices and duplicate CI runs for the same code |
| Security, authorization or data access | Focused negative/access-isolation checks and owner review | Real learner fixtures or production secrets |

Read the current head, instructions and relevant open work once at task start. Reuse unchanged content within the task; refresh at handoff, before integration, when another assistant has changed relevant files or when evidence is stale. Reading all history is not a routine task-start requirement.

Use one Issue for substantive coordinated work; a tiny fix can use its PR alone. Record meaningful scope changes, blockers, review findings or handoffs; skip acknowledgment-only comments and duplicate chat transcripts. Do not assume another assistant runs continuously or receives chat messages: pending handoffs live in GitHub until that assistant starts its next task.

Prefer PR-triggered lightweight checks, concurrency cancellation and one canonical full-validation run when needed. No unnecessary push-plus-PR duplicate builds, scheduled runs or artifact uploads. Read-only checks do not need production secrets. Tool capabilities and repository rules still apply.

## Set up before public publication

Adopt these instructions and templates while the repository is private, and use them from the first task. Publication does not reset the protocol or grant additional permissions. Keep current visibility as a verified fact in setup evidence rather than claiming it from this policy.

The owner completes the publication/privacy gate and configures the available security settings, branch protection, review requirements and required checks. If a control is unavailable for the private plan but available after publication, record that limitation and enable it during the controlled publication process. Do not pay for an upgrade without approval.

## Shared records

Approved decisions on the default branch are authoritative. Branch documents and unmerged PRs are proposals until approved and integrated; a claim in a setup note does not replace current code or check evidence.

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

Confirmed requirements in the technical, full-scope and Pilot documents apply unless the owner explicitly changes them.

## Task workflow

1. Read the current repository instructions, design documents, handoff and setup register. Verify default branch/head, relevant open PRs and Issues. State which branch and commit you are using. Never treat an unmerged PR as code already in `main`.
2. Use an existing scoped Issue or create one when implementation needs coordination. Record goal, acceptance criteria, dependencies, current implementing assistant and the planned reviewer. Do not create duplicate tracking tickets for a small documentation change already tracked by its PR.
3. One assistant owns a task branch at a time. The other reviews or works on an independent task/branch. Use separate worktrees or checkouts when available. Do not both push to the same branch without an explicit handoff.
4. Use a task branch and a focused PR against the agreed base. If work depends on an unmerged PR, declare that dependency; do not copy its changes into a second unrelated PR or assume it is merged. Never force-push over another assistant's work.
5. Implement the task, run relevant checks, review privacy exposure and update affected evidence/docs in the same change. Pin new dependencies and commit lockfiles. Do not run redundant matrices/builds just because another assistant takes over.
6. Have the other assistant review the actual diff, relevant requirements and test evidence. Review is independent of implementation; do not imply Claude reviewed code when only ChatGPT did. Do not submit a formal self-approval through a shared GitHub identity.
7. Integrate through PRs using the integration checklist and the owner's recorded merge authorization. An onboarding, review or documentation request alone is not authorization to merge unrelated code, deploy, publish the repository, spend money or introduce real learner data.
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

Do not include secrets, learner information, worksheet extracts, account or infrastructure identifiers, or private production logs: Issues and PRs must be safe for public publication. A chat-only “done” does not establish a shared project state. Technical blockers must be recorded as blockers, not guessed around.

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
- Treat every commit, Issue, PR comment and CI log as material intended for public publication. No paid infrastructure by default. Deployment is a distinct approved action.
- The full feature scope is not the build list; `docs/PILOT_V0_1_SCOPE.md` defines the committed slice.

## Access setup

After public publication, anyone can read this repository. Before publication, each assistant needs verified read access. Pushing branches and opening PRs requires repository-scoped write access granted by the owner. Verify access by reading the current main SHA and the three authoritative decision/scope documents. No tokens/passwords in source files, Issues, PRs or chat handoffs. Supabase/Vercel access is separate, must be verified independently, and its account and project details stay out of this repository.

If write access is unavailable, work from an explicitly identified snapshot and report its commit. Do not claim current GitHub inspection or push unverified changes.
