# Working on Turtle Academy

Public React/Vite/TypeScript learning PWA. Claude and ChatGPT use this workflow; private repositories add their data rules.

## Read for the task

Start with the current README, main and relevant open work. Follow only the needed references:

- Behavior: [functional design](docs/PILOT_FUNCTIONAL_DESIGN.md); [Pilot scope](docs/PILOT_V0_1_SCOPE.md) for delivery/release requirements; [engine specification](docs/PILOT_LEARNING_ENGINE_SPEC.md) for contracts and acceptance cases.
- Architecture/services: [technical decisions](docs/TECHNICAL_DESIGN_DECISIONS.md) and the affected code-area README. Repository settings are in [§7](docs/TECHNICAL_DESIGN_DECISIONS.md#repository-controls).
- Engineering changes and code reviews: follow [engineering verification](skills/engineering-verification/SKILL.md); use its preservation check for documentation cleanup.
- Questions: [common authoring skill](skills/question-authoring/SKILL.md), subject skill where present, and relevant preparation/research.
- Long-term scope: [feature scope](docs/FEATURE_SCOPE.md). Pilot omissions do not cancel it.

## Build and review

- Use one Issue or PR for the goal, acceptance criteria, preserved behavior, dependencies, progress and evidence. Small changes need only a PR; plan complex work briefly there. No parallel plans, ledgers, reports or approval stages merely for agent coordination.
- Keep one writer per task branch (`claude/…` or `chatgpt/…`); inspect its head, use an isolated checkout and transfer ownership before another agent edits. Never reset, force-push over or delete others' work. Parallelize bounded independent work only when worthwhile; separate files/resources, agree shared interfaces and one configuration/lockfile writer.
- Continue authorized work and make routine implementation choices; ask only for missing material decisions/access. Update the existing specification with agreed behavior changes; a separate decision PR is optional. Later explicit owner decisions supersede older conflicts; verify original evidence, never treat silence or an agent recommendation as approval. Unmerged proposals are not main. Follow the engineering-verification preservation check for requirements, authoring knowledge, sources and approvals.
- Match checks to the change: privacy/links/consistency for Markdown; affected tests/validators for code/content; build/integration for bundling/offline; negative ownership/recovery for auth/data. Follow the engineering skill for revision-bound evidence, verified testing links and limitations. Mechanical checks do not establish educational quality.
- Inspect visible UI changes with synthetic data at relevant viewports; link one screenshot set in the PR and chat, or state the unverified visual gap.
- Review and fix in-scope gaps on the existing PR branch; commit, push and verify. Use an independent agent for requirements and correctness together; reviewer-authored fixes need another reviewer. If unavailable, the owner may review or explicitly waive independent review; never invent it. Re-review fixes and affected paths, reusing valid unchanged-work evidence. Separate material findings from optional preferences; avoid scope creep, duplicate review stages and arbitrary round limits that leave material findings unresolved.
- Hand off in that record: goal/canonical references, branch/base/head, completed work/checks, findings/limits and next action/writer. Read it and the latest diff before resuming; do not restart completed work or pass a session transcript as requirements.
- State **Ready to merge**, **Not ready to merge** or **Unable to determine**, with findings and limits. A comment under the shared GitHub identity is not formal approval.
- The owner merges or authorizes the named PR at its current head; a changed head needs renewed authorization. Before an authorized squash merge, verify the head, required checks, review/waiver and resolved blockers/conflicts; record authorization once and close the task after integration. Deployment, publication, real-data use and spending retain their own owner decisions.

Refine existing guidance for demonstrated gaps; avoid a new policy, checklist or document for every minor finding. Preserve unique knowledge under the engineering-verification preservation check.

## Data boundaries

Keep public files, discussions, logs, previews and fixtures free of real learner records, private extracts and credentials. Use synthetic development data; keep private originals outside the checkout. Separate learner instances from generic content, enforce authenticated family/child ownership, and preserve offline work and the distinction between story completion and learning evidence. No runtime AI, privileged frontend keys or unrelated service-project reuse. Verify the service target before writes; isolate staging/production and keep production secrets out of PR jobs. New paid services require approval.
