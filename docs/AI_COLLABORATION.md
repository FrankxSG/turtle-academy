# Turtle Academy — Claude and ChatGPT Collaboration

Established: 2026-10-10 by the project owner's request to use GitHub as the shared source of truth.
Applies equally to Claude and ChatGPT. Neither assistant's chat history is inherently authoritative over the other's.

## Principles

- **GitHub is the shared source of truth.** Approved default-branch decisions define requirements, code and checks define implementation, and Issues and PRs define active work. A later explicit owner instruction supersedes an older record: update the affected document before other work relies on it.
- **One task, one branch, one implementing assistant.** Either assistant can implement or review; roles are per task, not a permanent "Claude codes / ChatGPT plans" split.
- **Merging is authorized per PR.** The owner merges, or tells an assistant to merge a specific PR. Nothing in this protocol grants standing merge, publication, deployment or spending permission.
- **Checks are proportional to the change**, and results for unchanged tested code are reused.
- **Minimal administration.** One tracking record, one focused PR and one concise validation summary per task.
- **Reviews produce GitHub action.** When the owner requests a PR review, record the reviewed head, actionable findings and validation limits on the PR; do not deliver a chat-only review. If fixes are already within the owner-authorised scope, update the existing PR branch, verify the changes and record the new head for independent review. If a decision is needed, post the concrete finding on the PR and ask only for that missing decision while completing unaffected work. Keep chat updates brief.
- **Everything is public.** Every committed file, branch, PR, Issue, comment and log must be safe to publish. Real learner information, personal documents, infrastructure details and credentials stay outside the repository.

## Shared records

Approved decisions on the default branch are authoritative. Branch documents and unmerged PRs are proposals until approved and integrated; a claim in a setup note does not replace current code or check evidence.

| Record | Use |
| --- | --- |
| `docs/TECHNICAL_DESIGN_DECISIONS.md` | Confirmed architecture, privacy and technical constraints |
| `docs/FEATURE_SCOPE.md` | Full long-term feature and curriculum scope; not a release checklist |
| `docs/PILOT_V0_1_SCOPE.md` + `docs/PILOT_FUNCTIONAL_DESIGN.md` + `docs/PILOT_LEARNING_ENGINE_SPEC.md` | Together define the committed Pilot delivery slice: scope/gates, functional behavior and engine/acceptance |
| `docs/FOUNDATION_SETUP.md` | Infrastructure/code validation evidence, with date, branch and links |
| `docs/TECHNICAL_HANDOFF.md` | Entry summary for new sessions |
| GitHub Issues | Task scope, acceptance criteria, current owner, dependencies and blockers |
| GitHub PRs | Concrete proposed changes, review, tests, merge authorization and integration history |
| `AGENTS.md` and `CLAUDE.md` | Small entrypoints to this common protocol; do not duplicate separate rule sets |

Chat decisions that change architecture or scope must be recorded in the appropriate document through a reviewable change. Keep a proposal labelled as a proposal until confirmed; tests cannot turn a proposed product decision into a confirmed requirement. Confirmed requirements in the technical, full-scope and Pilot documents apply unless the owner explicitly changes them.

## Task lifecycle

Every task follows these seven steps once, in order.

1. **Start.** Read the current `main` head, these instructions and the open PRs and Issues relevant to the task, once. State the base SHA you are working from. Never treat an unmerged PR as code already in `main`. Reading all history is not a routine requirement; refresh only at handoff, before merging, when the other assistant has changed relevant files or when evidence is stale.
2. **Claim.** Record the goal, acceptance criteria, implementing assistant, reviewer, affected paths and dependencies in one tracking record: an Issue for substantive work, or the PR alone for a small change. Check that no open work already holds those paths. Do not create duplicate tracking records.
3. **Build.** Work on `claude/<short-topic>` or `chatgpt/<short-topic>` in a separate checkout, and open a draft PR against `main`.
   - Reserve the actual shared files you will change, not whole folders.
   - Keep one active writer for dependency manifests/lockfiles and for each shared configuration file. The other assistant requests its change in the same tracking record instead of making a competing edit.
   - Agree the minimum shared contract (component, schema or API) before dependent work. The contract has one owner; dependent PRs declare the dependency and integrate after it.
   - Keep architecture and feature-scope decisions out of implementation PRs; decision documents change only for explicitly confirmed changes, in their own focused PR.
   - Update from `main` only when shared changes, conflicts, rules or validation require it. Never force-push over, reset or delete another assistant's work.
   - Pin new dependencies and commit lockfiles. Update affected evidence and docs in the same change.
4. **Check.** Run the checks in the table below for the change type, at the PR head, and record the tested SHA. Reuse earlier results only for unchanged code, and do not rerun checks merely because the other assistant takes over. Review the diff, PR text and commit messages for publication and privacy exposure.
5. **Review.** The other assistant reviews the current PR head and records the reviewed SHA, findings and limitations in one comment. Both tools act through the same GitHub identity, so this comment records an independent review but is not a formal approval and cannot satisfy a required approval. If the other assistant is unavailable, the owner reviews or explicitly waives the review; never invent a cross-assistant review.
6. **Merge.** Merge ready PRs one at a time, by squash merge only.
   - The owner merges, or authorizes an assistant to merge a named PR, in chat or on GitHub. Authorization covers that PR at the head SHA it was given for; any new commit needs fresh authorization. A request to review, onboard or edit documentation is not merge authorization.
   - Before merging, the assistant posts one comment on the PR recording the authorization and the head SHA, then confirms: the head is unchanged, required checks pass, an independent review is recorded with no unresolved blocking findings (unless the owner has explicitly accepted those specific findings or waived the review), and there are no conflicts with `main`. Stop and report if anything differs.
   - Pin the merge to the authorized head SHA. Never bypass a failing or missing required check.
   - After each merge, the implementer of any other open PR checks the new `main` for interface, dependency or overlapping-file changes and rechecks only what is affected.
7. **Close.** Update the tracking record once with the merge commit and any remaining limitations, and close completed Issues. Merged branches are deleted automatically by repository setting; do not delete branches manually. Refresh from GitHub before the next task.

Merge authorization never covers deployment, repository publication, real learner data or spending; each remains a separate owner decision.

## Checks by change type

| Change | Necessary validation | Avoid |
| --- | --- | --- |
| Documentation/protocol | Privacy check, links and consistency, diff review | Dependency install, app build or browser suite solely for text changes |
| Lesson/content data | Content/schema and answer-key checks, affected lesson smoke test, privacy/licensing review | Full browser matrix for an isolated content correction |
| UI or learning logic | Type check and affected behavior tests; build when bundling or offline assets change | Repeating an unchanged suite after every small edit |
| Shared engine, persistence, dependencies or build | Relevant regression/build/offline checks; broader coverage when the risk warrants it | Unrelated matrices and duplicate CI runs for the same code |
| Security, authorization or data access | Focused negative/access-isolation checks and owner review | Real learner fixtures or production secrets |

The automatic `Privacy guard` runs on every PR and supplements, but does not replace, human review. Prefer PR-triggered lightweight checks, concurrency cancellation and one canonical full-validation run when needed. Avoid duplicate push-plus-PR builds, scheduled runs and artifact uploads. Read-only checks never need production secrets.

## Communication and handoff

Record meaningful scope changes, blockers, review findings, merge authorizations and handoffs in GitHub; skip acknowledgment-only comments and chat transcripts. Do not assume the other assistant runs continuously or receives chat messages: pending handoffs live in GitHub until that assistant starts its next task. A chat-only "done" does not establish shared project state.

When transferring work, leave this in the Issue or PR:

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

A handoff transfers ownership of the named branch and files. Do not include secrets, learner information, worksheet extracts, account or infrastructure identifiers, or private production logs. Record technical blockers as blockers rather than guessing around them.

## Evidence and disagreements

- Distinguish confirmed requirements, implementation, successful tests and unresolved validation. Attach relevant commits and run links, not only a conclusion.
- Refresh stale GitHub state before correcting the other assistant. Code may have changed since either chat.
- Treat historical prototype names, suggested module layouts and assistant-generated options as context, not current decisions.
- Discuss architectural alternatives in a scoped Issue or PR. Do not reopen a confirmed choice without a material technical, educational, privacy or security reason.
- If a change truly needs a new owner decision, state the concrete conflict and proposed resolution. Neither assistant invents approval for the other.
- Verify current vendor documentation when giving settings, quotas or authentication instructions. Guide through observed app flows; do not invent menus, require URL editing or ask for screenshots that are unnecessary. If account-specific state cannot be read, say what remains unverified.

## Non-negotiable project boundaries

- No runtime AI. Owner-authorised private external ChatGPT/Claude processing of cropped/redacted worksheet material is allowed for human-verified preparation only; never runtime AI or public learner-data disclosure.
- Synthetic development data only; no real learner files anywhere in the checkout, including ignored folders, screenshots or artifacts.
- Separate generic content from private learner instances; enforce authenticated ownership, RLS and private storage for registered records.
- Guest remains local-only and cannot silently acquire registered-only capabilities.
- Preserve offline data and distinguish submissions/story from verified mastery. Specify idempotency and reconciliation before implementing registered sync.
- Keep unrelated applications, accounts/projects and environments isolated. Inspect actual target identities before service writes.
- No paid infrastructure by default. Deployment is a distinct approved action.
- The full feature scope is not the build list; Pilot Scope + Functional Design + Learning Engine together define the committed slice.

## Access and repository settings

Each assistant needs verified access before work; pushing branches, opening PRs and executing authorized merges require repository-scoped write access granted by the owner. Verify access by reading the current `main` SHA and the three authoritative decision/scope documents. No tokens or passwords in source files, Issues, PRs or chat handoffs. Supabase/Vercel access is separate, must be verified independently, and its account and project details stay out of this repository. If write access is unavailable, work from an explicitly identified snapshot and report its commit.

The owner configures these settings. GitHub then enforces that every change to `main` arrives through a pull request with a passing `privacy-guard` check, and that `main` cannot be force-pushed or deleted. GitHub does **not** enforce owner authorization or independent review: with 0 required approvals, any account with write access can merge. Authorization and review therefore remain procedural requirements of this protocol, recorded on each PR. Record what is actually configured in `docs/FOUNDATION_SETUP.md`; do not claim a setting from this list alone.

| Setting | Value | Why |
| --- | --- | --- |
| Ruleset on `main`: require a pull request | On, **0 required approvals** | Both assistants share one GitHub identity, which cannot approve its own PRs; authorization is recorded in a PR comment instead |
| Ruleset on `main`: required status check | `privacy-guard` | No merge without the automatic privacy check |
| Ruleset on `main`: block force pushes and deletion | On | Protects published history |
| Ruleset: require review from Code Owners | Off | `.github/CODEOWNERS` remains advisory: changes to those paths always get the owner's attention before merge authorization |
| Merge methods | Squash merging only | One commit per task on `main` |
| Automatically delete head branches | On | Merged task branches are removed without manual action |
| Actions: workflow permissions | Read-only | Least privilege |
| Actions: fork pull request workflows | Require approval for all external contributors | Untrusted code never runs unreviewed |
| Secret Protection and push protection | On | Blocks accidental credential commits |

Publication does not reset this protocol or grant additional permissions. If a control is unavailable on the current plan, record that limitation; do not pay for an upgrade without approval.
