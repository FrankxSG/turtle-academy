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

- Use one Issue or PR for the goal, constraints/dependencies, progress, handoff and evidence. Small changes need only a PR.
- Keep one writer per task branch (`claude/…` or `chatgpt/…`); inspect its head and use an isolated checkout. Preserve other work; never reset, force-push over or delete it. Independent tasks can run in parallel with separate files/resources; agree shared interfaces and one configuration/lockfile writer first.
- Make routine implementation choices and continue authorized work. Ask for missing material product decisions. Update the existing specification alongside an agreed behavior change; a separate decision PR is optional. Preserve requirements, authoring knowledge, sources and approvals. Later explicit owner decisions supersede older conflicts; verify the original decision evidence before attributing a choice to the owner. A blank answer or agent recommendation is not approval. Unmerged proposals are not main.
- Run checks for the changed behavior and report the actual tested revision, build mode and limits. Distinguish implemented, tested, deployed and accessible behavior; verify the application and entry flow before offering a testing link. Reuse valid evidence. Markdown needs privacy, links and consistency checks; code/content needs affected tests/validators; bundling/offline needs build/integration checks; auth/data needs negative ownership/recovery checks. Mechanical checks do not establish educational quality.
- Inspect visible UI changes with synthetic data at relevant viewports; link one screenshot set in the PR and chat, or state the unverified visual gap.
- Review means fix in-scope gaps, commit and push to the existing PR branch, verify, and hand off the updated revision. Do not expand the task for minor suggestions. A different agent reviews requirements and correctness, including reviewer-authored fixes; if unavailable, the owner may review or explicitly waive that review. Never invent independent review.
- State **Ready to merge**, **Not ready to merge** or **Unable to determine**, with findings and limits. A comment under the shared GitHub identity is not formal approval.
- The owner merges or authorizes the named PR at its current head; a changed head needs renewed authorization. Before an authorized squash merge, verify the head, required checks, review/waiver and resolved blockers/conflicts; record authorization once and close the task after integration. Deployment, publication, real-data use and spending retain their own owner decisions.

## Data boundaries

Keep public files, discussions, logs, previews and fixtures free of real learner records, private extracts and credentials. Use synthetic development data; keep private originals outside the checkout. Separate learner instances from generic content, enforce authenticated family/child ownership, and preserve offline work and the distinction between story completion and learning evidence. No runtime AI, privileged frontend keys or unrelated service-project reuse. Verify the service target before writes; isolate staging/production and keep production secrets out of PR jobs. New paid services require approval.
