# Working on Turtle Academy

Public React/Vite/TypeScript learning PWA. Claude and ChatGPT share these collaboration rules; private repositories add their own data-handling rules.

## Start with the task

Read the current README, current main and relevant open work. Follow only the references needed:

- Behavior: [Pilot functional design](docs/PILOT_FUNCTIONAL_DESIGN.md); [scope](docs/PILOT_V0_1_SCOPE.md) for delivery/release boundaries; [engine specification](docs/PILOT_LEARNING_ENGINE_SPEC.md) for contracts and F01–F40.
- Architecture, auth, storage or services: [technical decisions](docs/TECHNICAL_DESIGN_DECISIONS.md) and the affected code-area README.
- Questions/coverage: [common authoring skill](skills/question-authoring/SKILL.md), the subject skill if present, and relevant subject preparation/research references.
- Long-term scope changes: [confirmed feature scope](docs/FEATURE_SCOPE.md). Pilot omissions do not cancel it.
- Repository administration/history: [foundation register](docs/FOUNDATION_SETUP.md#repository-controls) when relevant.

## Build and coordinate

- Use one Issue or PR as the task record: goal, necessary constraints/dependencies, progress and evidence. Small changes need only a PR. Keep handoffs and reviews there rather than creating additional documents.
- One implementer owns each task branch (`claude/…` or `chatgpt/…`). Continue existing work when appropriate; inspect its head before editing. Use an isolated checkout/worktree or connector branch. Never reset, force-push over or delete another agent's work.
- Parallelize independent work with distinct files/resources. Agree shared interfaces first; keep one writer for shared configuration/lockfiles. A handoff names the branch, completed work, evidence and next action.
- Make routine implementation choices and continue authorized work. Ask for a missing material product decision. Update the relevant existing specification alongside an agreed behavior change in the same implementation PR; separate decision PRs are optional.
- Preserve requirements, question-authoring knowledge, sources and approval evidence when shortening text. Later explicit owner decisions supersede conflicting older records; unmerged proposals are not main.

## Verify and review

- Run relevant checks and report evidence/limits at the tested revision. Reuse valid evidence for unchanged code. Markdown needs privacy, links and consistency checks; an app build/browser suite is unnecessary solely for text.
- Code/content changes need affected tests/validators; bundling/offline changes need build/integration checks; auth/data changes need negative ownership/recovery checks. Mechanical checks do not establish educational quality.
- Inspect visible UI changes using synthetic data at relevant viewports. Link one screenshot set from PR and chat. If unavailable, describe the specific gap without claiming visual acceptance.
- A different agent reviews requirements and correctness at the current head. If the other agent is unavailable, the owner may review or explicitly waive cross-agent review; never invent an independent review.
- When reviewing a PR, fix in-scope gaps, commit the changes to that PR's existing branch, run relevant checks and hand the updated head to the next reviewer. Complete fixes within the authorized task; ask only for a missing material decision or access needed to finish. Reviewer-authored fixes need another reviewer (or the owner-review/waiver exception above). Keep minor suggestions from expanding the task.
- Every review states **Ready to merge**, **Not ready to merge**, or **Unable to determine**, with reviewed revision, findings and limits. Shared GitHub identity means a review comment is not formal approval.
- The owner merges or authorizes a named PR at its current head. A changed head requires renewed authorization. Before an authorized squash merge, verify the unchanged head, required checks, independent review (or recorded owner review/explicit waiver) and no unresolved blockers/conflicts; record authorization once on the PR. Close the task after integration.
- Deployment, publication, real-data use and spending retain their applicable owner decisions and release requirements. Merge permission does not authorize these operations.

## Boundaries

Keep public files, PRs, Issues, logs, previews and fixtures free of real learner records, private extracts and credentials. Use synthetic development data; private originals stay outside the checkout. Separate private learner instances from generic content, enforce authenticated family/child ownership, and preserve offline work and the distinction between story completion and learning evidence. No runtime AI, privileged frontend keys or unrelated service-project reuse. Verify the actual service target before writes; keep staging/production separate and production secrets out of PR jobs. New paid services require approval.
