# Working on Turtle Academy

Public React/Vite/TypeScript learning PWA. The private resources repo holds reference text and approved anonymous authoring records; it is never a public dependency.

## Start and coordinate

- Check current main and relevant open PRs. Read [README](README.md), then only the files needed for the task. [Pilot](docs/PILOT_FUNCTIONAL_DESIGN.md) owns release behavior; [technical decisions](docs/TECHNICAL_DESIGN_DECISIONS.md) owns architecture/privacy; [full scope](docs/FEATURE_SCOPE.md) is the long-term roadmap, not today's build list.
- One task, one implementing agent, one branch/PR (`claude/…` or `chatgpt/…`). Use an isolated checkout/worktree or a connector branch. Reuse existing work; check its head before editing. Never reset another agent's work.
- Parallelize only independent tasks with distinct files/resources. Give each worker the goal, owned paths, constraints and expected result. Agree shared interfaces first; keep one writer for shared files and lockfiles.
- Put the task, current head, remaining work and validation in its Issue or PR. That is the handoff; do not create a second plan, ledger or review document. Routine implementation choices stay with the implementer; ask only for a missing material decision.
- A different agent reviews requirements and correctness at the current head. Fix substantive findings in the same PR; scope re-review to fixes and affected behavior. Record minor suggestions without turning them into release gates.
- Every review states **Ready to merge**, **Not ready to merge**, or **Unable to determine**, with findings, tested/reviewed SHA and limits. Both assistants share an identity: a review comment is not a formal GitHub approval.
- Only the owner merges or explicitly authorizes a named PR at its current head. Squash only; required checks must pass. Deployment, first real-data use and spending require their applicable owner authorization.

## Boundaries and checks

- No runtime AI. No authentic learner records, worksheets, handwriting, photographs, credentials or private-library text in public files, conversations, tests, logs, builds or previews. Generic code may handle private data; authorization and data separation must enforce privacy.
- Use synthetic development data, least-privilege CI and dedicated staging/production. Keep private repository Actions disabled. Never use production secrets in PR workflows.
- Run relevant checks once for the changed code; reuse unchanged evidence. Docs: privacy, links and consistency. Engine/UI: affected tests/typecheck; build/browser checks when affected. Auth/data: negative ownership and recovery tests. No app build solely for Markdown.
- Content work: [common authoring skill](skills/question-authoring/SKILL.md), then the subject skill if present. Keep question JSON/schema as the source and generate repeated views.
- Update the single relevant specification with an agreed behavior change in the same PR. Do not add policies, duplicate status narratives or mandatory frameworks. Preserve confirmed requirements when shortening text.

## Map and commands

`src/engine/`: learning rules; `src/ui|hub|parent/`: screens; `src/catalogue/`, `content/`: reviewed content; `src/mistakes/`: pack intake; `supabase/`: migrations/tests; `src/trials/`: isolated demos.

`npm run typecheck`, `test:engine`, `test:ui`, `build`, `test:e2e`; `python3 scripts/privacy_guard.py`. Setup and content commands are in README and the relevant subject guide.

