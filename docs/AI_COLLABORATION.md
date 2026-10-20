# Collaboration reference

[AGENTS.md](../AGENTS.md) is the shared workflow for Claude and ChatGPT. Use this reference for repository access/settings; ordinary work follows the task-specific links in AGENTS.

## Access and repository settings

The owner grants repository-scoped access. Read current main to verify access; identify the commit and limits when using a snapshot. Service access is separate. Keep credentials and infrastructure identifiers out of public records.

These are intended controls, not proof of current configuration. [FOUNDATION_SETUP.md](FOUNDATION_SETUP.md) retains dated evidence; verify settings before relying on enforcement. GitHub's zero-approval setup cannot enforce the owner's merge authorization or independent review; those remain in AGENTS.

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


Report unavailable controls rather than buying an upgrade. Keep **Allow edits from maintainers** enabled for fork contributions when available. Verify current vendor documentation and observed settings for service instructions; report inaccessible state as unverified. Publication requirements remain in [technical decisions](TECHNICAL_DESIGN_DECISIONS.md#7-public-repository-governance-and-minimum-cost-ci).
